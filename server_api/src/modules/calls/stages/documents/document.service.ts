// project-document.service.ts
import { DeleteDto } from "../../../../util/delete.dto";
import { ConstraintValidator } from "../../../grants/constraints/constraint.validator";
import { IProjectRepository, ProjectRepository } from "../../../projects/project.repository";
import { ProjectSynchronizer } from "../../../projects/project.synchronizer";
import { StageStatus } from "../stage.enum";
import { IStageRepository, StageRepository } from "../stage.repository";
import { CreateProjectDocumentDTO, GetProjectDocumentDTO, UpdateProjectDocumentDTO } from "./document.dto";
import { ProjectDocStatus } from "./document.enum";
import { IDocumentRepository, DocumentRepository } from "./document.repository";
import { DocumnetStateMachine } from "./document.state-machine";

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

    // ------------------------------------
    // VALIDATIONS
    // ------------------------------------

    private async validateCreate(dto: CreateProjectDocumentDTO) {

    }

    async create(dto: CreateProjectDocumentDTO) {
        const { project, stage, documentPath } = dto;

        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new Error("Project not found");
        
        const stageDoc = await this.stageRepository.findOne({ _id: stage, call: String(projectDoc.call) });
        if (!stageDoc) throw new Error("Stage not found");
        if (stageDoc.status !== StageStatus.active) throw new Error("Stage is not active");
        if (stageDoc.deadline < new Date()) throw new Error("Stage deadline has passed");
        
        if (stageDoc.order > 1) {
            const previousDocs = await this.repository.find({ project }, false);
            const hasNotAccepted = previousDocs.some(
                doc => doc.status !== ProjectDocStatus.accepted
            );
            if (hasNotAccepted) {
                throw new Error('Previous documents must be accepted before proceeding.');
            }
        }

        try {
            ///grant validator////
            await this.validator.validateProject(project, projectDoc);

            const created = await this.repository.create(dto);
            const syncedProject = await this.projectSynchronizer.syncProjectStatus(project, projectDoc);
            return { created, syncedProject }
        } catch (e: any) {
            throw e;
        }

    }

    async get(options: GetProjectDocumentDTO = {}) {
        return await this.repository.find(options);
    }

    async update(dto: UpdateProjectDocumentDTO) {
        const { id, data } = dto;
        const newStatus = data.status;
        if (!newStatus) {
            throw new Error("Status Not Fouund!");
        }
        const projectStage = await this.repository.findById(id);
        if (!projectStage || !projectStage.status) throw new Error("Project stage not found");
        const currentStatus = projectStage.status;
        DocumnetStateMachine.validateTransition(currentStatus, newStatus);
        return await this.repository.update(dto.id, dto.data);
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const projectStage = await this.repository.findById(id);
        if (!projectStage) throw new Error("Project stage not found");
        //const projectDoc = projectStage.project as IProject;
        if (projectStage.status !== ProjectDocStatus.pending) {
            throw new Error("Only project stages with 'pending' status can be deleted.");
        }
        const deleted = await this.repository.delete(id);
        const syncedProject = await this.projectSynchronizer.syncProjectStatus(projectStage.project.toString());
        return { deleted, syncedProject };
    }
}
