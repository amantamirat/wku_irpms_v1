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
            .lean<IProject>()
            .exec();
    }

    async find(filters: GetProjectsDTO) {
        const query: any = {};
        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }
        if (filters.leadPI) {
            query.leadPI = new mongoose.Types.ObjectId(filters.leadPI);
        }

        if (filters.status) {
            query.status = filters.status;
        }

        return Project.find(query)
            .populate("call")
            .populate("leadPI")
            //.populate("createdBy")
            //.skip(filters.skip ?? 0)
            //.limit(filters.limit ?? 0)
            .lean<IProject[]>()
            .exec();
    }

    async create(dto: CreateProjectDTO) {
        return Project.create({
            ...dto,
            call: new mongoose.Types.ObjectId(dto.call),
            leadPI: new mongoose.Types.ObjectId(dto.applicantId)
        });
    }

    async update(id: string, dtoData: UpdateProjectDTO["data"]): Promise<IProject> {
        const updateData: Partial<IProject> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.summary) updateData.summary = dtoData.summary;
        if (dtoData.status) updateData.status = dtoData.status;

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
