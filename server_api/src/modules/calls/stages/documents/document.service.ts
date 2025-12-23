// project-document.service.ts
import { DeleteDto } from "../../../../util/delete.dto";
import { ConstraintValidator } from "../../../grants/constraints/constraint.validator";
import { IProjectRepository, ProjectRepository } from "../../../projects/project.repository";
import { ProjectSynchronizer } from "../../../projects/project.synchronizer";
import { StageStatus } from "../stage.status";
import { IStageRepository, StageRepository } from "../stage.repository";
import { CreateDocumentDTO, GetDocumentDTO, UpdateStatusDTO } from "./document.dto";
import { DocStatus } from "./document.status";
import { IDocumentRepository, DocumentRepository } from "./document.repository";
import { DocumentStateMachine } from "./document.state-machine";
import { ProjectStatus } from "../../../projects/project.status";

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
            const { project, stage } = dto;
            const projectDoc = await this.projectRepository.findById(project);
            if (!projectDoc) throw new Error("Project not found.");
            if (projectDoc.status === ProjectStatus.rejected) {
                throw new Error("Project is rejected.");
            }
            const projectDocs = await this.repository.find({ project }, false);
            const hasNotAccepted = projectDocs.some(doc => doc.status !== DocStatus.accepted);
            if (hasNotAccepted) {
                throw new Error('Previous project documents must be accepted before proceeding.');
            }
            const nextOrder = projectDocs.length + 1;
            const nextStageDoc = await this.stageRepository.findOne({ call: String(projectDoc.call), order: nextOrder });
            if (!nextStageDoc) throw new Error("Next stage not found");
            if (nextStageDoc.status !== StageStatus.active) throw new Error(`${nextStageDoc.name} stage is not active`);
            if (nextStageDoc.deadline < new Date()) throw new Error(`${nextStageDoc.name} stage deadline has passed`);

            await this.validator.validateProject(project, projectDoc);

            const created = await this.repository.create({ ...dto, stage: String(nextStageDoc._id) });
            let syncedProject;
            if (created) {
                syncedProject = await this.projectSynchronizer.syncProjectStatus(project, projectDoc, projectDocs);
            }
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
        const { id, userId } = dto;
        const projectStageDoc = await this.repository.findById(id);
        if (!projectStageDoc) throw new Error("Project stage not found");
        if (projectStageDoc.status !== DocStatus.pending) throw new Error("Pending document not found.");
        const deleted = await this.repository.delete(id);
        if (deleted) {
            await this.projectSynchronizer.syncProjectStatus(projectStageDoc.project.toString());
        }
        return { deleted };
    }
}
