import mongoose from "mongoose";
import { StageStatus } from "./stage.enum";
import { ProjectStage } from "./stage.model";

export interface GetProjectStageOptions {
    _id?: string;
    project?: string;
    stage?: string;
    status?: StageStatus;
}

export interface CreateProjectStageDto {
    project: mongoose.Types.ObjectId;
    stage: mongoose.Types.ObjectId;
    status?: StageStatus;
}

export interface UpdateProjectStageDto {
    status?: StageStatus;
}

export class ProjectStageService {

    static async createProjectStage(data: CreateProjectStageDto) {
        const createdStage = await ProjectStage.create(data);
        return createdStage;
    }

    static async getProjectStages(options: GetProjectStageOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        if (options.stage) filter.stage = options.stage;
        if (options.status) filter.status = options.status;

        const projectStages = await ProjectStage.find(filter)
            .populate("project")
            .populate("stage")
            .lean();
        return projectStages;
    }

    static async findProjectStage(options: GetProjectStageOptions) {
        const filter: any = {};
        if (options._id) filter._id = options._id;
        if (options.project) filter.project = options.project;
        if (options.stage) filter.stage = options.stage;
        if (options.status) filter.status = options.status;

        return await ProjectStage.findOne(filter)
            .populate("project")
            .populate("stage")
            .lean();
    }

    static async updateProjectStage(id: string, data: Partial<UpdateProjectStageDto>) {
        const projectStage = await ProjectStage.findById(id);
        if (!projectStage) throw new Error("Project stage not found");

        Object.assign(projectStage, data);
        return projectStage.save();
    }

    static async deleteProjectStage(id: string) {
        const projectStage = await ProjectStage.findById(id);
        if (!projectStage) throw new Error("Project stage not found");

        return projectStage.deleteOne();
    }
}
