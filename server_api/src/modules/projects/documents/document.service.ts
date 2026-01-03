// project-document.service.ts
import { SYSTEM } from "../../../common/constants/system.constant";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../util/delete.dto";
import { IStageRepository, StageRepository } from "../../calls/stages/stage.repository";
import { StageStatus } from "../../calls/stages/stage.status";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import { ProjectSynchronizer } from "../project.synchronizer";
import { CreateDocumentDTO, GetDocumentDTO, UpdateStatusDTO } from "./document.dto";
import { IDocumentRepository, DocumentRepository } from "./document.repository";
import { DocumentStateMachine } from "./document.state-machine";
import { DocStatus } from "./document.status";


export class DocumentService {

    private repository: IDocumentRepository;
    private projectRepository: IProjectRepository;
    private stageRepository: IStageRepository;
    private projectSynchronizer: ProjectSynchronizer;
    private validator: ConstraintValidator;

    constructor(repository?: IDocumentRepository, projectRepository?: IProjectRepository,
        stageRepository?: IStageRepository
    ) {
        this.repository = repository || new DocumentRepository();
        this.projectRepository = projectRepository || new ProjectRepository();
        this.stageRepository = stageRepository || new StageRepository();
        this.projectSynchronizer =
            new ProjectSynchronizer(this.projectRepository, this.repository);
        this.validator = new ConstraintValidator(this.projectRepository);
    }

    async create(dto: CreateDocumentDTO) {
        try {
            const { project, stage, applicantId } = dto;

            const projectDoc = await this.projectRepository.findById(project);
            if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

            if (String(projectDoc.leadPI) !== applicantId && SYSTEM.SU_USER !== applicantId)
                throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);
            if (projectDoc.status === ProjectStatus.rejected)
                throw new AppError(ERROR_CODES.PROJECT_REJECTED);

            const projectDocs = await this.repository.find({ project }, false);
            const hasNotAccepted = projectDocs.some(doc => doc.status !== DocStatus.accepted);
            if (hasNotAccepted)
                throw new AppError(ERROR_CODES.PROJECT_DOC_NOT_ACCEPTED);

            const nextOrder = projectDocs.length + 1;
            const nextStageDoc = await this.stageRepository.findOne({ call: String(projectDoc.call), order: nextOrder });
            if (!nextStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

            if (nextStageDoc.status !== StageStatus.active) throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
            if (nextStageDoc.deadline < new Date()) throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);

            await this.validator.validateProject(project, projectDoc);

            const created = await this.repository.create({ ...dto, stage: String(nextStageDoc._id) });
            const syncedProject = await this.projectSynchronizer.syncProjectStatus(project, projectDoc, [...projectDocs, created]);

            return { created, syncedProject }
        } catch (e: any) {
            throw e;
        }
    }

    async get(options: GetDocumentDTO = {}) {
        return await this.repository.find(options);
    }
    /**
        * Update Status
    */
    async updateStatus(dto: UpdateStatusDTO) {
        const { documents, status: newStatus } = dto.data;
        if (!documents || documents.length === 0) {
            throw new Error("No documents provided");
        }
        if (!newStatus) {
            throw new Error("Status not found");
        }
        const validDocs = [];
        for (const id of documents) {
            const doc = await this.repository.findById(id);
            if (!doc) throw new Error(`Document not found: ${id}`);

            const projectDoc = await this.projectRepository.findById(String(doc.project));
            if (!projectDoc) throw new Error(`Project not found: ${doc.project}`);
            const projectStatus = projectDoc.status;

            if (projectStatus !== ProjectStatus.submitted &&
                projectStatus !== ProjectStatus.accepted &&
                projectStatus !== ProjectStatus.rejected
            ) {
                throw new Error("INVALID_PROJECT_STATUS_FOR_DOCUMENT_UPDATE");
            }
            const current = doc.status;
            DocumentStateMachine.validateTransition(current, newStatus);
            if (newStatus === DocStatus.reviewed) {
                const currentStageDoc = await this.stageRepository.findOne({ _id: String(doc.stage) });
                if (!currentStageDoc) throw new Error("Current stage not found");
                const projectDocs = await this.repository.find({ project: String(doc.project) }, false);
                if (projectDocs.length > currentStageDoc.order) {
                    throw new Error(`Can not change the status of ${currentStageDoc.name} of the project`);
                }
            }
            validDocs.push(doc);
        }

        const results = await Promise.all(
            validDocs.map(async (doc) => {
                const updated = await this.repository.update(doc._id, {
                    status: newStatus
                });
                if (updated) {
                    await this.projectSynchronizer.syncProjectStatus(
                        String(doc.project));
                }
                return updated;
            })
        );
        return results;
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId: userId } = dto;

        const projectStageDoc = await this.repository.findById(id);
        if (!projectStageDoc)
            throw new AppError(ERROR_CODES.PROJECT_DOC_NOT_FOUND);
        if (projectStageDoc.status !== DocStatus.pending)
            throw new AppError(ERROR_CODES.PROJECT_DOC_NOT_PENDING);

        const projectDoc = await this.projectRepository.findById(String(projectStageDoc.project));
        if (!projectDoc)
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        if (String(projectDoc.leadPI) !== userId && SYSTEM.SU_USER !== userId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);


        const deleted = await this.repository.delete(id);
        if (deleted) {
            await this.projectSynchronizer.syncProjectStatus(projectStageDoc.project.toString());
        }
        return { deleted };
    }
}
