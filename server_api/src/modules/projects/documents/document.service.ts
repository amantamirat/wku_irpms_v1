// project-document.service.ts
import { SYSTEM } from "../../../common/constants/system.constant";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { ApplicantRepository } from "../../applicants/applicant.repository";
import { CallRepository, ICallRepository } from "../../calls/call.repository";
import { CallStatus } from "../../calls/call.status";
import { ReviewerRepository } from "../../calls/stages/reviewers/reviewer.repository";
import { ReviewerStatus } from "../../calls/stages/reviewers/reviewer.status";
import { ICallStageRepository } from "../../calls/stages/call.stage.repository";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { CollaboratorRepository } from "../collaborators/collaborator.repository";
import { PhaseType } from "../phase/phase.enum";
import { PhaseRepository } from "../phase/phase.repository";
import { IProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.state-machine";
import { CollabSynchronizer, DocSynchronizer, PhaseSynchronizer, ProjectSyncOrchestrator } from "../project.synchronizer";
//import { ProjectThemeRepository } from "../themes/project.theme.repository";
import { CreateDocumentDTO, GetDocumentDTO, SubmitProjectDTO, UpdateStatusDTO } from "./document.dto";
import { IDocumentRepository } from "./document.repository";
import { DocumentStateMachine } from "./document.state-machine";
import { DocStatus } from "./document.status";
import { CallStageStatus } from "../../calls/stages/call.stage.model";

export class DocumentService {

    constructor(
        private readonly docRepository: IDocumentRepository,
        private readonly projectRepository: IProjectRepository,
        private readonly stageRepository: ICallStageRepository,
        private readonly callRepository: ICallRepository = new CallRepository(),
        private readonly appRepository = new ApplicantRepository(),
        //private readonly themeRepository = new ThemeRepository(),
        // private readonly projectThemeRepository = new ProjectThemeRepository(),
        private readonly collabRepository = new CollaboratorRepository(),
        private readonly phaseRepository = new PhaseRepository(),
        private readonly reviewerRepository = new ReviewerRepository(),

        private readonly docSynchronizer = new DocSynchronizer(
            projectRepository,
            docRepository
        ),

        private readonly phaseSynchronizer = new PhaseSynchronizer(
            projectRepository,
            phaseRepository
        ),

        private readonly collabSynchronizer = new CollabSynchronizer(
            projectRepository,
            collabRepository
        ),

        private readonly orchestrator = new ProjectSyncOrchestrator(
            docSynchronizer,
            phaseSynchronizer,
            collabSynchronizer
        ),

        private readonly validator: ConstraintValidator = new ConstraintValidator(
            projectRepository),

    ) { }

    async create(dto: CreateDocumentDTO) {
        try {
            const { project, applicantId } = dto;

            const projectDoc = await this.projectRepository.findById(project);
            if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

            if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
                throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

            if (projectDoc.status === ProjectStatus.rejected)
                throw new AppError(ERROR_CODES.PROJECT_REJECTED);

            const projectDocs = await this.docRepository.find({ project });
            const hasNotAccepted = projectDocs.some(doc => doc.status !== DocStatus.accepted);
            if (hasNotAccepted)
                throw new AppError(ERROR_CODES.DOC_NOT_ACCEPTED);

            const call = String(projectDoc.grant);
            const nextOrder = projectDocs.length + 1;
            const stageDocs = await this.stageRepository.find({ call, order: 1 });
            if (stageDocs.length < 1) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            const nextStageDoc = stageDocs[0];

            if (nextStageDoc.status !== CallStageStatus.active) throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
            if (!nextStageDoc.deadline || nextStageDoc.deadline < new Date()) throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);


            if (nextOrder === 1) {
                const callDoc = await this.callRepository.findById(call);
                if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

                const collaborators = await this.collabRepository.find({ project });
                const phases = await this.phaseRepository.find({ project });
                // const projectThemes = await this.projectThemeRepository.find({ project });
                //const themes: string[] = projectThemes.map(pt => String(pt.theme));
                await this.validator.validateProjectConstraints(String(callDoc.grantAllocation),
                    { collaborators, phases });
            }

            const created = await this.docRepository.create({ ...dto, stage: String(nextStageDoc._id) });
            if (created) await this.docSynchronizer.sync(project);
            return created;

        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.DOC_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getById(id: string) {
        const doc = await this.docRepository.findById(id);
        if (!doc) throw new AppError(ERROR_CODES.DOC_NOT_FOUND);
        return doc;
    }

    async submit(dto: SubmitProjectDTO) {
        const { call, title, summary, applicant, collaborators, phases, themes, documentPath } = dto;

        const applicantDoc = await this.appRepository.findById(applicant);
        if (!applicantDoc) throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);

        const callDoc = await this.callRepository.findById(call);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

        const stageDocs = await this.stageRepository.find({ call, order: 1 });
        if (stageDocs.length < 1) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const firstStageDoc = stageDocs[0];

        if (!firstStageDoc.deadline) {
            throw new AppError("Stage deadline is missing");
        }

        if (firstStageDoc.status !== CallStageStatus.active) {
            throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
        }

        if (firstStageDoc.deadline < new Date()) {
            throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);
        }
        const appDocs = [];
        for (const app of collaborators) {
            const appDoc = await this.appRepository.findById(app);
            if (!appDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);
            appDocs.push(appDoc);
        }

        await this.validator.validateProjectConstraints(String(callDoc.grantAllocation), dto);

        const projectDoc = await this.projectRepository.create({ grant: call, title, applicant, summary, themes: [] });
        const projectId = String(projectDoc._id);
        await this.collabRepository.createMany(
            collaborators.map(col => ({
                project: projectId,
                applicant: col
            }))
        );

        /*
        await this.phaseRepository.createMany(
            phases.map(phase => ({
                type: PhaseType.phase,
                project: projectId,
                //activity: phase.activity,
                budget: phase.budget,
                duration: phase.duration,
                description: phase.description
            }))
        );

        await this.projectThemeRepository.createMany(
            themes.map(thm => ({
                project: projectId,
                theme: thm
            }))
        );
        */



        await this.docRepository.create({
            project: projectId,
            stage: String(firstStageDoc._id),
            documentPath: documentPath,
            applicantId: applicant
        });

        await this.orchestrator.sync(projectId);
    }

    async get(options: GetDocumentDTO = {}) {
        return await this.docRepository.find({ ...options, populate: true });
    }
    /**
        * Update Status
    */
    async updateStatus(dto: UpdateStatusDTO) {
        const { documents, status: next } = dto;
        if (!documents || documents.length === 0) {
            throw new Error(ERROR_CODES.DOC_NOT_FOUND);
        }
        const validDocs = [];
        for (const id of documents) {
            const docDoc = await this.docRepository.findById(id);
            if (!docDoc) throw new Error(ERROR_CODES.DOC_NOT_FOUND);

            const stageDoc = await this.stageRepository.findById(String(docDoc.stage));
            if (!stageDoc)
                throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            if (stageDoc.status !== CallStageStatus.active)
                throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);

            const projectDoc = await this.projectRepository.findById(String(docDoc.project));
            if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);
            const projectStatus = projectDoc.status;

            if (projectStatus !== ProjectStatus.submitted &&
                projectStatus !== ProjectStatus.accepted &&
                projectStatus !== ProjectStatus.rejected
            ) {
                throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
            }

            const current = docDoc.status;
            DocumentStateMachine.validateTransition(current, next);

            if (current === DocStatus.selected) {
                if (next === DocStatus.submitted) {
                    if (await this.reviewerRepository.exist({ projectStage: id })) {
                        throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
                    }
                }
            }
            if (current === DocStatus.reviewed) {
                if (next === DocStatus.selected) {
                    const reviewers = await this.reviewerRepository.find({ projectStage: id });
                    const allApproved = reviewers.every(r => r.status === ReviewerStatus.approved);
                    if (allApproved) {
                        throw new AppError(ERROR_CODES.APPROVED_REVIEWER_ALREADY_EXISTS);
                    }
                }
            }

            if (current === DocStatus.accepted || current === DocStatus.rejected) {

                if (next === DocStatus.submitted && docDoc.totalScore) {
                    throw new AppError(ERROR_CODES.DOC_SCORE_ALREADY_EXISTS);
                }
                if (next === DocStatus.reviewed && docDoc.totalScore == null) {
                    throw new AppError(ERROR_CODES.DOC_SCORE_NOT_EXISTS);
                }
                const projectDocs = await this.docRepository.find({ project: String(docDoc.project) });
                /*
                if (projectDocs.length > stageDoc.order) {
                    throw new AppError(ERROR_CODES.NEXT_DOC_ALREADY_EXISTS);
                }
                    */
            }
            validDocs.push(docDoc);
        }

        const results = await Promise.all(
            validDocs.map(async (doc) => {
                const updated = await this.docRepository.update(String(doc._id), {
                    status: next
                });
                if (updated) {
                    await this.docSynchronizer.sync(
                        String(doc.project));
                }
                return updated;
            })
        );
        return results;
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const projectDocument = await this.docRepository.findById(id);
        if (!projectDocument) throw new AppError(ERROR_CODES.DOC_NOT_FOUND);
        if (projectDocument.status !== DocStatus.submitted)
            throw new AppError(ERROR_CODES.DOC_NOT_SUBMITTED);

        const project = String(projectDocument.project)
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        const deleted = await this.docRepository.delete(id);
        if (deleted) await this.docSynchronizer.sync(project);
        return deleted;
    }
}
