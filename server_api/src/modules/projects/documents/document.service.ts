// project-document.service.ts
import { SYSTEM } from "../../../common/constants/system.constant";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../util/delete.dto";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { StageStatus } from "../../calls/stages/stage.status";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { IProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import { ProjectSynchronizer, DocStatusSynchronizer } from "../project.synchronizer";
import { CreateDocumentDTO, GetDocumentDTO, UpdateStatusDTO } from "./document.dto";
import { IDocumentRepository } from "./document.repository";
import { DocumentStateMachine } from "./document.state-machine";
import { DocStatus } from "./document.status";

export class DocumentService {

    private projectSynchronizer: ProjectSynchronizer;
    private readonly validator: ConstraintValidator;

    constructor(
        private readonly repository: IDocumentRepository,
        private readonly projectRepository: IProjectRepository,
        private readonly stageRepository: IStageRepository,
    ) {
        this.projectSynchronizer = new DocStatusSynchronizer(this.projectRepository, this.repository);
        this.validator = new ConstraintValidator(this.projectRepository);
    }

    async create(dto: CreateDocumentDTO) {
        try {
            const { project, applicantId } = dto;

            const projectDoc = await this.projectRepository.findById(project);
            if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

            if (projectDoc.status === ProjectStatus.rejected)
                throw new AppError(ERROR_CODES.PROJECT_REJECTED);

            if (String(projectDoc.leadPI) !== applicantId && SYSTEM.SU_USER !== applicantId)
                throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

            const projectDocs = await this.repository.find({ project });
            const hasNotAccepted = projectDocs.some(doc => doc.status !== DocStatus.accepted);
            if (hasNotAccepted)
                throw new AppError(ERROR_CODES.DOC_NOT_ACCEPTED);

            const nextOrder = projectDocs.length + 1;
            const nextStageDoc = await this.stageRepository.findOne({ call: String(projectDoc.call), order: nextOrder });
            if (!nextStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

            if (nextStageDoc.status !== StageStatus.active) throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
            if (nextStageDoc.deadline < new Date()) throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);

            await this.validator.validateProject(project, projectDoc);

            const created = await this.repository.create({ ...dto, stage: String(nextStageDoc._id) });
            
            if (created) await this.projectSynchronizer.sync(project);
            
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.DOC_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async get(options: GetDocumentDTO = {}) {
        return await this.repository.find({ ...options, populate: true });
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
            const docDoc = await this.repository.findById(id);
            if (!docDoc) throw new Error(ERROR_CODES.DOC_NOT_FOUND);

            const stageDoc = await this.stageRepository.findById(String(docDoc.stage));
            if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            if (stageDoc.status !== StageStatus.active) throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);

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

            //backwards
            if (next === DocStatus.submitted || next === DocStatus.reviewed) {
                if (projectStatus !== ProjectStatus.accepted && projectStatus !== ProjectStatus.rejected) {
                    throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
                }
                if (next === DocStatus.submitted && docDoc.totalScore) {
                    throw new AppError(ERROR_CODES.DOC_SCORE_ALREADY_EXISTS);
                }
                if (next === DocStatus.reviewed && !docDoc.totalScore) {
                    throw new AppError(ERROR_CODES.DOC_SCORE_NOT_EXISTS);
                }
                const projectDocs = await this.repository.find({ project: String(docDoc.project) });
                if (projectDocs.length > stageDoc.order) {
                    throw new AppError(ERROR_CODES.NEXT_DOC_ALREADY_EXISTS);
                }

            }
            validDocs.push(docDoc);
        }

        const results = await Promise.all(
            validDocs.map(async (doc) => {
                const updated = await this.repository.update(String(doc._id), {
                    status: next
                });
                if (updated) {
                    await this.projectSynchronizer.sync(
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
        if (!projectDocument) throw new AppError(ERROR_CODES.DOC_NOT_FOUND);
        if (projectDocument.status !== DocStatus.submitted)
            throw new AppError(ERROR_CODES.DOC_NOT_SUBMITTED);

        const project = String(projectDocument.project)
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.leadPI) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        const deleted = await this.repository.delete(id);
        if (deleted) await this.projectSynchronizer.sync(project);
        return deleted;
    }
}
