// project-stage.service.ts

import { IProjectStageRepository, ProjectStageRepository } from "./project-stage.repository";
import { CreateProjectStageDTO, DeleteProjectStageDTO, GetProjectStagesDTO, UpdateProjectStageDTO } from "./project-stage.dto";

import { Project } from "../../../projects/project.model";
import { Stage } from "../stage.model";
import { ProjectStage } from "./project-stage.model";
import { ProjectStageStatus } from "./project-stage.enum";
import { ProjectStageStateMachine } from "./project-stage.state-machine";

export class ProjectStageService {
    private repository: IProjectStageRepository;

    constructor(repository?: IProjectStageRepository) {
        this.repository = repository || new ProjectStageRepository();
    }

    // ------------------------------------
    // VALIDATIONS
    // ------------------------------------

    private async validateCreate(dto: CreateProjectStageDTO) {
        const project = await Project.findById(dto.projectId).lean();
        if (!project) throw new Error("Project not found");

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

            if (prevProjectStage.status !== ProjectStageStatus.accepted) {
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
        return this.repository.updateState(dto.id, dto.data);
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
