// project-document.service.ts
import { SYSTEM } from "../../../common/constants/system.constant";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { ApplicantRepository } from "../../applicants/applicant.repository";
import { CallRepository, ICallRepository } from "../../calls/call.repository";
import { CallStatus } from "../../calls/call.status";
import { ICallStageRepository } from "../../calls/stages/call.stage.repository";
import { ReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.status";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { CollaboratorRepository } from "../collaborators/collaborator.repository";
import { PhaseRepository } from "../phase/phase.repository";
import { IProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.state-machine";
import { CollabSynchronizer, ProjectStageSynchronizer, PhaseSynchronizer, ProjectSyncOrchestrator } from "../project.synchronizer";
//import { ProjectThemeRepository } from "../themes/project.theme.repository";
import { CallStageStatus } from "../../calls/stages/call.stage.model";
import { CreateProjectStageDTO, GetProjectStageDTO, SubmitProjectDTO, UpdateStatusDTO } from "./project.stage.dto";
import { IProjectStageRepository } from "./project.stage.repository";
import { DocumentStateMachine } from "./project.stage.state-machine";
import { ProjectStageStatus } from "./project.stage.status";

export class ProjectStageOldService {

    constructor(
        private readonly repository: IProjectStageRepository,
        private readonly projectRepository: IProjectRepository,
        private readonly stageRepository: ICallStageRepository,
        private readonly callRepository: ICallRepository = new CallRepository(),
        private readonly appRepository = new ApplicantRepository(),
        //private readonly themeRepository = new ThemeRepository(),
        // private readonly projectThemeRepository = new ProjectThemeRepository(),
        private readonly collabRepository = new CollaboratorRepository(),
        private readonly phaseRepository = new PhaseRepository(),
        private readonly reviewerRepository = new ReviewerRepository(),

        private readonly docSynchronizer = new ProjectStageSynchronizer(
            projectRepository,
            repository
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

    async create(dto: CreateProjectStageDTO) {
        try {
            const { project, applicantId } = dto;

            const projectDoc = await this.projectRepository.findById(project);
            if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

            if (String(projectDoc.applicant) !== applicantId)
                throw new AppError(ERROR_CODES.UNAUTHORIZED);

            if (projectDoc.status === ProjectStatus.rejected)
                throw new AppError(ERROR_CODES.PROJECT_REJECTED);

            const projectDocs = await this.repository.find({ project });
            const hasNotAccepted = projectDocs.some(doc => doc.status !== ProjectStageStatus.accepted);
            if (hasNotAccepted)
                throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_ACCEPTED);

            const call = String(projectDoc.grantAllocation);
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

            const created = await this.repository.create({ ...dto, grantStage: String(nextStageDoc._id) });
            if (created) await this.docSynchronizer.sync(project);
            return created;

        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PROJECT_STAGE_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getById(id: string) {
        const doc = await this.repository.findById(id);
        if (!doc) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);
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

        const projectDoc = await this.projectRepository.create({ grantAllocation: call, title, applicant, summary, themes: [] });
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



        await this.repository.create({
            project: projectId,
            grantStage: String(firstStageDoc._id),
            documentPath: documentPath,
            applicantId: applicant
        });

        await this.orchestrator.sync(projectId);
    }

    async get(options: GetProjectStageDTO = {}) {
        return await this.repository.find({ ...options, populate: true });
    }
    /**
        * Update Status
    */
    async updateStatus(dto: UpdateStatusDTO) {
        const { documents, status: next } = dto;
        if (!documents || documents.length === 0) {
            throw new Error(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);
        }
        const validDocs = [];
        for (const id of documents) {
            const docDoc = await this.repository.findById(id);
            if (!docDoc) throw new Error(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);

            const stageDoc = await this.stageRepository.findById(String(docDoc.grantStage));
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

            if (current === ProjectStageStatus.selected) {
                if (next === ProjectStageStatus.submitted) {
                    if (await this.reviewerRepository.exist({ projectStage: id })) {
                        throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
                    }
                }
            }
            if (current === ProjectStageStatus.reviewed) {
                if (next === ProjectStageStatus.selected) {
                    const reviewers = await this.reviewerRepository.find({ projectStage: id });
                    const allApproved = reviewers.every(r => r.status === ReviewerStatus.approved);
                    if (allApproved) {
                        throw new AppError(ERROR_CODES.APPROVED_REVIEWER_ALREADY_EXISTS);
                    }
                }
            }

            if (current === ProjectStageStatus.accepted || current === ProjectStageStatus.rejected) {

                if (next === ProjectStageStatus.submitted && docDoc.totalScore) {
                    throw new AppError(ERROR_CODES.DOC_SCORE_ALREADY_EXISTS);
                }
                if (next === ProjectStageStatus.reviewed && docDoc.totalScore == null) {
                    throw new AppError(ERROR_CODES.DOC_SCORE_NOT_EXISTS);
                }
                const projectDocs = await this.repository.find({ project: String(docDoc.project) });
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
                const updated = await this.repository.update(String(doc._id), {
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

        const projectDocument = await this.repository.findById(id);
        if (!projectDocument) throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_FOUND);
        if (projectDocument.status !== ProjectStageStatus.submitted)
            throw new AppError(ERROR_CODES.DOC_NOT_SUBMITTED);

        const project = String(projectDocument.project)
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        const deleted = await this.repository.delete(id);
        if (deleted) await this.docSynchronizer.sync(project);
        return deleted;
    }
}
