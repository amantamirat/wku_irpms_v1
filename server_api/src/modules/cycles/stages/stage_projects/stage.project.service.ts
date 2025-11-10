import mongoose from "mongoose";
import { ProjectStageStatus } from "./stage.project.enum";
import { ProjectStage } from "./stage.project.model";
import { Project } from "../../../projects/project.model";

export interface GetProjectStageOptions {
    _id?: string;
    project?: mongoose.Types.ObjectId;
    //stage?: mongoose.Types.ObjectId;
    status?: ProjectStageStatus;
}

export interface CreateProjectStageDto {
    project: mongoose.Types.ObjectId;
    //stage: mongoose.Types.ObjectId;
    documentPath: string;
    status?: ProjectStageStatus;
}

export interface UpdateProjectStageDto {
    status?: ProjectStageStatus;
}

export class ProjectStageService {

    private static async validateProjectStage(ps: Partial<CreateProjectStageDto>) {
        const project = await Project.findById(ps.project).lean();
        if (!project) {
            throw new Error("Project Not Found!");
        }
        /*
        const stage = await Stage.findById(ps.stage).lean();
        //validate against call
        if (!stage) {
            throw new Error("Stage Not Found!");
        }
        if (stage.order > 1) {
            const prevStage = await Stage.findOne({ order: stage.order - 1, parent: stage.parent }).lean();
            if (!prevStage) {
                throw new Error("Previous Stage Not Found!");
            }
            const prevProjectStage = await ProjectStage.findOne({ project: ps.project, stage: prevStage._id }).lean();
            if (!prevProjectStage) {
                throw new Error("Previous Project Stage Not Found!");
            }
            if (prevProjectStage.status !== ProjectStageStatus.accepted) {
                throw new Error("Previous Project Stage is Not Accepted!");
            }
        }
        */
        
    }

    static async createProjectStage(data: CreateProjectStageDto) {
        await this.validateProjectStage(data);
        const createdStage = await ProjectStage.create(data);
        return createdStage;
    }

    static async getProjectStages(options: GetProjectStageOptions) {
        const filter: any = {};
        if (options.project) filter.project = options.project;
        //if (options.stage) filter.stage = options.stage;
        //if (options.status) filter.status = options.status;

        const projectStages = await ProjectStage.find(filter)
            .populate("project")
            .populate("stage")
            .lean();
        return projectStages;
    }



    static async updateProjectStage(id: string, data: Partial<UpdateProjectStageDto>) {
        const projectStage = await ProjectStage.findById(id);
        if (!projectStage) throw new Error("Project stage not found");
        if (data.status && data.status !== projectStage.status) {
            const allowedTransitions: Record<ProjectStageStatus, ProjectStageStatus[]> = {
                [ProjectStageStatus.pending]: [ProjectStageStatus.submitted],
                [ProjectStageStatus.submitted]: [ProjectStageStatus.pending, ProjectStageStatus.accepted],
                [ProjectStageStatus.accepted]: [ProjectStageStatus.submitted],
            };

            const currentStatus = projectStage.status;
            const newStatus = data.status;

            if (!allowedTransitions[currentStatus].includes(newStatus)) {
                throw new Error(`Invalid status transition from '${currentStatus}' to '${newStatus}'`);
            }
        }
        Object.assign(projectStage, data);
        return projectStage.save();
    }

    static async deleteProjectStage(id: string) {
        const projectStage = await ProjectStage.findById(id);
        if (!projectStage) throw new Error("Project stage not found");
        if (projectStage.status !== ProjectStageStatus.pending) {
            throw new Error(`Can not delete ${projectStage.status} project stage`);
        }
        const deletedDoc = projectStage.toObject();
        await projectStage.deleteOne();
        return { documentPath: deletedDoc.documentPath };
    }
}
