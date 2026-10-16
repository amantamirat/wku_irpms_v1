import mongoose from "mongoose";
import { toObjectId } from "../../../../common/utils/mongoose.utils";
import {
    CreateProjectComponentDto,
    FilterProjectComponents,
    UpdateProjectComponentDto,
} from "./phase-component.dto";
import { IProjectComponent, ProjectComponent } from "./phase-component.model";

export interface IProjectComponentRepository {
    findById(id: string): Promise<IProjectComponent | null>;
    find(filter?: FilterProjectComponents): Promise<IProjectComponent[]>;
    create(data: CreateProjectComponentDto, userId?: string): Promise<IProjectComponent>;
    update(id: string, data: UpdateProjectComponentDto, userId: string): Promise<IProjectComponent | null>;
    delete(id: string): Promise<IProjectComponent | null>;
    deleteByProject(projectId: string): Promise<unknown>;
}

export class ProjectComponentRepository implements IProjectComponentRepository {
    async findById(id: string): Promise<IProjectComponent | null> {
        return ProjectComponent.findById(toObjectId(id))
            .populate("contributors", "_id name email")
            .lean<IProjectComponent>()
            .exec();
    }

    async find(filter: FilterProjectComponents = {}): Promise<IProjectComponent[]> {
        const query: Record<string, unknown> = {};
        if (filter.project) {
            query.project = new mongoose.Types.ObjectId(String(filter.project));
        }
        return ProjectComponent.find(query)
            .sort({ createdAt: 1 })
            .populate("contributors", "_id name email")
            .lean<IProjectComponent[]>()
            .exec();
    }

    async create(data: CreateProjectComponentDto, userId?: string): Promise<IProjectComponent> {
        return ProjectComponent.create({
            ...data,
            project: toObjectId(data.project),
            contributors: data.contributors.map(toObjectId),
            createdBy: userId ? toObjectId(userId) : undefined,
        });
    }

    async update(id: string, data: UpdateProjectComponentDto, userId: string): Promise<IProjectComponent | null> {
        const update: Record<string, any> = { ...data, updatedBy: toObjectId(userId) };
        if (data.contributors) update.contributors = data.contributors.map(toObjectId);
        return ProjectComponent.findByIdAndUpdate(
            toObjectId(id),
            { $set: update },
            { new: true, runValidators: true }
        ).lean<IProjectComponent>().exec();
    }

    async delete(id: string): Promise<IProjectComponent | null> {
        return ProjectComponent.findByIdAndDelete(toObjectId(id))
            .lean<IProjectComponent>()
            .exec();
    }

    async deleteByProject(projectId: string): Promise<unknown> {
        return ProjectComponent.deleteMany({ project: toObjectId(projectId) }).exec();
    }
}
