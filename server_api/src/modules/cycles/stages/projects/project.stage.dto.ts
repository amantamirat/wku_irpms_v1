import mongoose from "mongoose";
import { ProjectStageStatus } from "./project.stage.enum";

export interface GetProjectStagesDTO {
    project?: mongoose.Types.ObjectId;
    stage?: mongoose.Types.ObjectId;
    status?: ProjectStageStatus;
    skip?: number;
    limit?: number;
}

export interface CreateProjectStageDTO {
    stage: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    documentPath: string;
    status?: ProjectStageStatus;
}

export interface UpdateProjectStageDTO {
    id: string;
    data: Partial<{
        documentPath: string;
        status: ProjectStageStatus;
    }>;
}

export interface DeleteProjectStageDto {
    id: string | mongoose.Types.ObjectId;
    userId: string;
}
