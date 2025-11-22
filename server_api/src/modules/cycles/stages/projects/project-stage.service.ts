// project-stage.service.ts

import { IProjectStageRepository, ProjectStageRepository } from "./project-stage.repository";
import { CreateProjectStageDTO, DeleteProjectStageDTO, GetProjectStagesDTO, UpdateProjectStageDTO } from "./project-stage.dto";
import { Stage } from "../stage.model";
import { ProjectStage } from "./project-stage.model";
import { ProjectStageStatus } from "./project-stage.enum";
import { ProjectStageStateMachine } from "./project-stage.state-machine";
import { IProjectRepository, ProjectRepository } from "../../../projects/project.repository";

export class ProjectStageService {
    private repository: IProjectStageRepository;
    private projectRepository: IProjectRepository;

    constructor(repository?: IProjectStageRepository, projectRepository?: IProjectRepository) {
        this.repository = repository || new ProjectStageRepository();
        this.projectRepository = projectRepository || new ProjectRepository();
    }

    // ------------------------------------
    // VALIDATIONS
    // ------------------------------------

    private async validateCreate(dto: CreateProjectStageDTO) {
        const projectDoc = await this.projectRepository.findById(dto.projectId);
        if (!projectDoc) throw new Error("Project not found");

        const stage = await Stage.findById(dto.stageId).lean();
        if (!stage) throw new Error("Stage not found");
        if (stage.status !== "active") throw new Error("Stage is not active");
        if (stage.deadline < new Date()) throw new Error("Stage deadline has passed");

        // Check previous stage
        if (stage.order > 1) {
            const prevStage = await Stage.findOne({
                order: stage.order - 1,
                cycle: stage.cycle
            }).lean();

            if (!prevStage) throw new Error("Previous stage not found");

            const prevProjectStage = await ProjectStage.findOne({
                project: dto.projectId,
                stage: prevStage._id
            }).lean();

            if (!prevProjectStage) throw new Error("Previous project stage not found");

            if (prevProjectStage.status !== ProjectStageStatus.reviewed) {
                throw new Error("Previous project stage is not accepted");
            }
        }
    }


    async createProjectStage(dto: CreateProjectStageDTO) {
        await this.validateCreate(dto);
        return this.repository.create(dto);
    }

    async getProjectStages(options: GetProjectStagesDTO = {}) {
        return this.repository.find(options);
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
        return this.repository.update(dto.id, dto.data);
    }

    async deleteProjectStage(dto: DeleteProjectStageDTO) {
        const { id, userId } = dto;
        const projectStage = await this.repository.findById(id);
        if (!projectStage) throw new Error("Project stage not found");

        if (projectStage.status !== ProjectStageStatus.pending) {
            throw new Error("Only project stages with 'pending' status can be deleted.");
        }
        return this.repository.delete(id);
    }
}
