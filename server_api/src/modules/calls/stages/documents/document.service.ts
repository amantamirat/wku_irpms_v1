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
        this.projectSynchronizer = new ProjectSynchronizer(this.projectRepository, this.repository);
        this.validator = new ConstraintValidator(this.projectRepository);
    }


    async create(dto: CreateDocumentDTO) {
        try {
            const { project, stage } = dto;
            const projectDoc = await this.projectRepository.findById(project);
            if (!projectDoc) throw new Error("Project not found");
            
            const stageDoc = await this.stageRepository.findOne({ _id: stage, call: String(projectDoc.call) });
            if (!stageDoc) throw new Error("Stage not found");
            if (stageDoc.status !== StageStatus.active)
                throw new Error("Stage is not active");
            if (stageDoc.deadline < new Date())
                throw new Error("Stage deadline has passed");

            if (stageDoc.order > 1) {
                const previousDocs = await this.repository.find({ project }, false);
                const hasNotAccepted = previousDocs.some(
                    doc => doc.status !== DocStatus.accepted
                );
                if (hasNotAccepted) {
                    throw new Error('Previous documents must be accepted before proceeding.');
                }
            }
            ///grant validator////
            await this.validator.validateProject(project, projectDoc);
            const created = await this.repository.create(dto);
            const syncedProject = await this.projectSynchronizer.syncProjectStatus(project, projectDoc);
            return { created, syncedProject }
        } catch (e: any) {
            throw e;
        }
    }

    async get(options: GetDocumentDTO = {}) {
        return await this.repository.find(options);
    }

    /*
    async update(dto: UpdateDocumentDTO) {
        const { id, data } = dto;
        const newStatus = data.status;
        if (!newStatus) {
            throw new Error("Status Not Fouund!");
        }
        const projectStage = await this.repository.findById(id);
        if (!projectStage || !projectStage.status) throw new Error("Project stage not found");
        const currentStatus = projectStage.status;
        DocumentStateMachine.validateTransition(currentStatus, newStatus);
        return await this.repository.update(dto.id, dto.data);
    }
        */


    /**
         * Change Status
    */

    async updateStatus(dto: UpdateStatusDTO) {
        const { documents, status: newStatus } = dto.data;
        if (!documents || documents.length === 0) {
            throw new Error("No documents provided");
        }
        if (!newStatus) {
            throw new Error("Status not found");
        }
        const result = await Promise.all(
            documents.map(async (id) => {
                const doc = await this.repository.findById(id);
                if (!doc) throw new Error(`Document not found: ${id}`);
                /*
                if (newStatus === DocStatus.submitted) {
                    const projectDocs = await this.repository.find({ project: String(doc.project) }, false);
                    
                }
                    */
                DocumentStateMachine.validateTransition(doc.status, newStatus);
                const updated = this.repository.update(id, { status: newStatus });
                const syncedProject = this.projectSynchronizer.syncProjectStatus(String(doc.project));
                return updated;
            })
        );
        return result;
    }


    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const projectStage = await this.repository.findById(id);
        if (!projectStage) throw new Error("Project stage not found");
        if (projectStage.status !== DocStatus.pending) {
            throw new Error("Only project stages with 'pending' status can be deleted.");
        }
        const deleted = await this.repository.delete(id);
        const syncedProject = await this.projectSynchronizer.syncProjectStatus(projectStage.project.toString());
        return { deleted, syncedProject };
    }
}
