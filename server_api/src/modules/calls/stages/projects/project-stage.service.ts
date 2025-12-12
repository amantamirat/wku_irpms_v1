// project-stage.service.ts

import { ConstraintValidator } from "../../../grants/constraints/constraint.validator";
import { IProjectRepository, ProjectRepository } from "../../../projects/project.repository";
import { ProjectSynchronizer } from "../../../projects/project.synchronizer";
import { IStageRepository, StageRepository } from "../stage.repository";
import { CreateProjectStageDTO, DeleteProjectStageDTO, GetProjectStagesDTO, UpdateProjectStageDTO } from "./project-stage.dto";
import { ProjectStageStatus } from "./project-stage.enum";
import { IProjectStageRepository, ProjectStageRepository } from "./project-stage.repository";
import { ProjectStageStateMachine } from "./project-stage.state-machine";

export class ProjectStageService {
    private repository: IProjectStageRepository;
    private projectRepository: IProjectRepository;
    private stageRepository: IStageRepository;
    private projectSynchronizer: ProjectSynchronizer;
    private validator: ConstraintValidator;

    constructor(repository?: IProjectStageRepository, projectRepository?: IProjectRepository,
        stageRepository?: IStageRepository
    ) {
        this.repository = repository || new ProjectStageRepository();
        this.projectRepository = projectRepository || new ProjectRepository();
        this.stageRepository = stageRepository || new StageRepository();
        this.projectSynchronizer = new ProjectSynchronizer(this.projectRepository, this.repository);
        this.validator = new ConstraintValidator(this.projectRepository);
    }

    // ------------------------------------
    // VALIDATIONS
    // ------------------------------------

    private async validateCreate(dto: CreateProjectStageDTO) {

    }

    async createProjectStage(dto: CreateProjectStageDTO) {
        const { projectId, stageId, documentPath } = dto;
        ////validate/////
        const projectDoc = await this.projectRepository.findById(dto.projectId);
        if (!projectDoc) throw new Error("Project not found");
        const stage = await this.stageRepository.findById(dto.stageId);
        if (!stage) throw new Error("Stage not found");
        if (stage.status !== "active") throw new Error("Stage is not active");
        if (stage.deadline < new Date()) throw new Error("Stage deadline has passed");
        // Check previous stage
        if (stage.order > 1) {

            const prevStage = await this.stageRepository.findByOrderAndCycle({
                order: stage.order - 1,
                call: stage.call.toString()
            });


            if (!prevStage) throw new Error("Previous stage not found");
            /*
                       const prevProjectStage = await ProjectStage.findOne({
                           project: dto.projectId,
                           stage: prevStage._id
                       }).lean();
           
                       if (!prevProjectStage) throw new Error("Previous project stage not found");
           
                       if (prevProjectStage.status !== ProjectStageStatus.reviewed) {
                          // throw new Error("Previous project stage is not accepted");
                       }
                          */
        }
        //////validation end///////////
        
        try {
            ///grant validator////
            await this.validator.validateProject(projectId, projectDoc);
            ///grant validator////
            const created = await this.repository.create(dto);
            const syncedProject = await this.projectSynchronizer.syncProjectStatus(projectId, projectDoc);
            return { created, syncedProject }
        } catch (e: any) {
            throw e;
        }

    }

    async getProjectStages(options: GetProjectStagesDTO = {}) {
        return await this.repository.find(options);
    }

    async updateProjectStage(dto: UpdateProjectStageDTO) {
        const { id, data } = dto;
        const newStatus = data.status;
        if (!newStatus) {
            throw new Error("Status Not Fouund!");
        }
        const projectStage = await this.repository.findById(id);
        if (!projectStage || !projectStage.status) throw new Error("Project stage not found");
        const currentStatus = projectStage.status;
        ProjectStageStateMachine.validateTransition(currentStatus, newStatus);
        return await this.repository.update(dto.id, dto.data);
    }

    async deleteProjectStage(dto: DeleteProjectStageDTO) {
        const { id, userId } = dto;
        const projectStage = await this.repository.findById(id);
        if (!projectStage) throw new Error("Project stage not found");
        //const projectDoc = projectStage.project as IProject;
        if (projectStage.status !== ProjectStageStatus.pending) {
            throw new Error("Only project stages with 'pending' status can be deleted.");
        }
        const deleted = await this.repository.delete(id);
        const syncedProject = await this.projectSynchronizer.syncProjectStatus(projectStage.project.toString());
        return { deleted, syncedProject };
    }
}
