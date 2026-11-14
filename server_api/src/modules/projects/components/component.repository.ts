
import { FilterQuery } from "mongoose";
import { CreateProjectComponentDTO, FilterProjectComponents, ProjectComponentDto, UpdateProjectComponentDTO } from "./component.dto";
import { IProjectComponent, ProjectComponent, ProjectComponentStatus } from "./component.model";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { toObjectId } from "../../../common/utils/mongoose.utils";

export interface UpdateProjectComponentStatusDto {
    status: ProjectComponentStatus;
    reason?: string;
}

export class ProjectComponentRepository {

    // Maps the DTO filter to a real Mongo query
    private buildQuery(
        filters: FilterProjectComponents = {}
    ): FilterQuery<IProjectComponent> {
        const query: FilterQuery<IProjectComponent> = {};

        if (filters.project) query.project = filters.project;
        if (filters.title) query.title = filters.title;
        if (filters.description) query.description = filters.description;

        if (filters.contributor) query.contributors = filters.contributor;
        if (filters.theme) query.themes = filters.theme;

        // single `activity` and multi `activities` can be combined
        const activityIds = [
            ...(filters.activity ? [filters.activity] : []),
            ...(filters.activities ?? []),
        ];
        if (activityIds.length) query.activities = { $in: activityIds };

        if (filters.excludeId) query._id = { $ne: filters.excludeId };

        return query;
    }

    async create(
        dto: CreateProjectComponentDTO,
        userId: string
    ): Promise<IProjectComponent> {
        return await ProjectComponent.create({ ...dto, createdBy: toObjectId(userId) });
    }

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProjectComponent | null> {
        let query = ProjectComponent.findById(id);

        if (options?.populate) {
            query = query
                .populate("project")
                .populate("contributors")
                .populate("activities")
                .populate("themes");
        }

        return await query;
    }

    async find(
        filters: FilterProjectComponents,
        options?: FilterOptions
    ): Promise<IProjectComponent[]> {
        let query = ProjectComponent.find(this.buildQuery(filters));

        if (options?.populate) {
            query = query
                .populate("project")
                .populate("contributors")
                .populate("activities")
                .populate("themes");
        }

        return await query.sort({ title: 1 });
    }



    async update(
        id: string,
        data: UpdateProjectComponentDTO,
        userId: string
    ): Promise<IProjectComponent | null> {
        return await ProjectComponent.findByIdAndUpdate(
            id,
            { ...data, updatedBy: userId },
            {
                new: true,
                runValidators: true,
            }
        );
    }

    async updateStatus(
        id: string,
        data: UpdateProjectComponentStatusDto,
        userId: string
    ): Promise<IProjectComponent | null> {
        const { status, reason } = data;

        const component = await ProjectComponent.findById(toObjectId(id));
        if (!component) return null;

        // Avoid unnecessary history entries.
        if (component.status === status) return component;

        component.status = status;

        component.statusHistory.push({
            status,
            changedBy: toObjectId(userId),
            changedAt: new Date(),
            reason,
        });

        component.set("updatedBy", toObjectId(userId));

        return component.save();
    }

    async exists(filters: FilterProjectComponents): Promise<boolean> {
        const doc = await ProjectComponent.exists(this.buildQuery(filters));
        return doc !== null;
    }

    async count(filters: FilterProjectComponents = {}): Promise<number> {
        return await ProjectComponent.countDocuments(this.buildQuery(filters));
    }

    async delete(id: string): Promise<IProjectComponent | null> {
        return await ProjectComponent.findByIdAndDelete(id);
    }

    async deleteByProject(projectId: string): Promise<number> {
        const result = await ProjectComponent.deleteMany({
            project: projectId,
        });

        return result.deletedCount ?? 0;
    }
}
