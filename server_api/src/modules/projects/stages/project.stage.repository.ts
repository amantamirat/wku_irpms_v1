// project-stage.repository.ts
import mongoose, { HydratedDocument } from "mongoose";
import { ProjectStage, IProjectStage } from "./project.stage.model";
import {
    CreateProjectStageDTO,
    GetProjectStageDTO,
    UpdateStageDTO
} from "./project.stage.dto";
import { ProjectStageStatus } from "./project.stage.status";

export interface IProjectStageRepository {
    findById(id: string): Promise<IProjectStage | null>;
    find(filters: GetProjectStageDTO): Promise<Partial<IProjectStage>[]>;
    create(dto: CreateProjectStageDTO): Promise<IProjectStage>;
    update(id: string, status: UpdateStageDTO["data"]): Promise<IProjectStage | null>;
    updateStatus(id: string, newStatus: ProjectStageStatus): Promise<IProjectStage | null>;
    delete(id: string): Promise<IProjectStage | null>;
}


// MongoDB implementation
export class ProjectStageRepository implements IProjectStageRepository {

    async findById(id: string) {
        return ProjectStage.findById(new mongoose.Types.ObjectId(id))
            .lean<IProjectStage>()
            .exec();
    }

    async find(options: GetProjectStageDTO) {
        const query: any = {};

        if (options.project) {
            query.project = new mongoose.Types.ObjectId(options.project);
        }

        if (options.grantStage) {
            query.grantStage = new mongoose.Types.ObjectId(options.grantStage);
        }

        if (options.status) {
            query.status = options.status;
        }

        const dbQuery = ProjectStage.find(query);

        if (options.populate) {
            dbQuery
                .populate("project")
                .populate("grantStage");
        }
        return dbQuery
            .lean<IProjectStage[]>()
            .exec();
    }



    async create(dto: CreateProjectStageDTO): Promise<HydratedDocument<IProjectStage>> {
        const data: Partial<IProjectStage> = {
            project: new mongoose.Types.ObjectId(dto.project),
            grantStage: new mongoose.Types.ObjectId(dto.grantStage),
            documentPath: dto.documentPath
        };

        return ProjectStage.create(data);
    }

    async update(id: string, dtoData: UpdateStageDTO["data"]): Promise<IProjectStage | null> {
        const updateData: Partial<IProjectStage> = {};

        if (dtoData.totalScore !== undefined) {
            updateData.totalScore = dtoData.totalScore;
        }

        if (dtoData.status !== undefined) {
            updateData.status = dtoData.status;
        }
        return ProjectStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

    }

    async updateStatus(id: string, newStatus: ProjectStageStatus) {
        return ProjectStage.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async delete(id: string) {
        return ProjectStage.findByIdAndDelete(id).exec();
    }
}
