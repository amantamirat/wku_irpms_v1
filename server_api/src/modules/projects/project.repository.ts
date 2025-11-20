// project.repository.ts
import mongoose from "mongoose";
import { Project, IProject } from "./project.model";
import {
    CreateProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";

export interface IProjectRepository {
    findById(id: string): Promise<IProject | null>;
    find(filters: GetProjectsDTO): Promise<Partial<IProject>[]>;
    create(dto: CreateProjectDTO): Promise<IProject>;
    update(id: string, data: UpdateProjectDTO["data"]): Promise<IProject>;
    delete(id: string): Promise<IProject | null>;
}

// MongoDB implementation
export class ProjectRepository implements IProjectRepository {

    async findById(id: string) {
        return Project.findById(new mongoose.Types.ObjectId(id))
            .populate("cycle")
            .populate("leadPI")
            .populate("createdBy")
            .lean<IProject>()
            .exec();
    }

    async find(filters: GetProjectsDTO) {
        const query: any = {};

        if (filters.userId) {
            query.createdBy = new mongoose.Types.ObjectId(filters.userId);
        }

        if (filters.cycleId) {
            query.cycle = new mongoose.Types.ObjectId(filters.cycleId);
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return Project.find(query)
            .populate("cycle")
            .populate("leadPI")
            //.populate("createdBy")
            //.skip(filters.skip ?? 0)
            //.limit(filters.limit ?? 0)
            .lean<IProject[]>()
            .exec();
    }

    async create(dto: CreateProjectDTO) {
        const data: Partial<IProject> = {
            cycle: new mongoose.Types.ObjectId(dto.cycleId),
            title: dto.title,
            summary: dto.summary,
            status: dto.status,
            leadPI: new mongoose.Types.ObjectId(dto.leadPIId), // if needed you can change this
            createdBy: new mongoose.Types.ObjectId(dto.userId)           
        };

        return Project.create(data);
    }

    async update(id: string, dtoData: UpdateProjectDTO["data"]): Promise<IProject> {
        const updateData: Partial<IProject> = {};

        if (dtoData.title !== undefined) updateData.title = dtoData.title;
        if (dtoData.summary !== undefined) updateData.summary = dtoData.summary;
        if (dtoData.status !== undefined) updateData.status = dtoData.status;

        const updated = await Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();

        if (!updated) throw new Error("Project not found");
        return updated;
    }

    async delete(id: string) {
        return await Project.findByIdAndDelete(id).exec();
    }
}
