// project-stage.repository.ts
import mongoose from "mongoose";
import { ProjectStage, IProjectStage } from "./project-stage.model";
import {
    CreateProjectStageDTO,
    GetProjectStagesDTO,
    UpdateProjectStageDTO
} from "./project-stage.dto";

export interface IProjectStageRepository {
    findById(id: string): Promise<IProjectStage | null>; // <-- allow POJO
    find(filters: GetProjectStagesDTO): Promise<Partial<IProjectStage>[]>;
    create(dto: CreateProjectStageDTO): Promise<IProjectStage>;
    update(id: string, status: UpdateProjectStageDTO["data"]): Promise<IProjectStage>;
    delete(id: string): Promise<IProjectStage | null>;
}


// MongoDB implementation
export class ProjectStageRepository implements IProjectStageRepository {

    async findById(id: string) {
        return ProjectStage.findById(new mongoose.Types.ObjectId(id))
            .populate("project")
            .populate("stage")
            .lean<IProjectStage>()
            .exec();
    }

    async find(filters: GetProjectStagesDTO) {
        const query: any = {};

        if (filters.projectId) {
            query.project = new mongoose.Types.ObjectId(filters.projectId);
        }

        if (filters.stageId) {
            query.stage = new mongoose.Types.ObjectId(filters.stageId);
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return ProjectStage.find(query)
            .populate("project")
            .populate("stage")
            //.skip(filters.skip ?? 0)
            //.limit(filters.limit ?? 0)
            .lean<IProjectStage[]>()
            .exec();
    }

    async create(dto: CreateProjectStageDTO) {
        const data: Partial<IProjectStage> = {
            project: new mongoose.Types.ObjectId(dto.projectId),
            stage: new mongoose.Types.ObjectId(dto.stageId),
            documentPath: dto.documentPath
        };

        return ProjectStage.create(data);
    }

    async update(id: string, dtoData: UpdateProjectStageDTO["data"]): Promise<IProjectStage> {
        const updateData: Partial<IProjectStage> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore = dtoData.totalScore;
        }

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
        const updated = await ProjectStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("ProjectStage not found");
        return updated;
    }

    async delete(id: string) {
        return await ProjectStage.findByIdAndDelete(id).exec();
    }
}
