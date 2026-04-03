// project.repository.ts
import mongoose from "mongoose";
import { Project, IProject } from "./project.model";
import {
    CreateProjectDTO,
    ExistsProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { GrantAllocation } from "../grants/allocations/grant.allocation.model";
import { ProjectStatus } from "./project.state-machine";


export interface IProjectRepository {
    findById(id: string): Promise<IProject | null>;
    find(filters: GetProjectsDTO): Promise<Partial<IProject>[]>;
    create(dto: CreateProjectDTO): Promise<IProject>;
    update(id: string, data: UpdateProjectDTO["data"]): Promise<IProject | null>;
    updateStatus(id: string, newStatus: ProjectStatus): Promise<IProject | null>;
    exists(filters: ExistsProjectDTO): Promise<boolean>;
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

        // 1. Handle Status & Applicant
        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.applicant) {
            query.applicant = new mongoose.Types.ObjectId(filters.applicant);
        }

        if (filters.workspace) {
            query.workspace = new mongoose.Types.ObjectId(filters.workspace);
        }

        if (filters.grantAllocation) {
            query.grantAllocation = new mongoose.Types.ObjectId(filters.grantAllocation);
        } else if (filters.calendar || filters.grant) {
            const allocationQuery: any = {};
            if (filters.calendar) allocationQuery.calendar = filters.calendar;
            if (filters.grant) allocationQuery.grant = filters.grant;
            const matchingAllocations = await GrantAllocation.find(allocationQuery)
                .select('_id')
                .lean();
            const allocationIds = matchingAllocations.map(a => a._id);
            // Tell the Project query: "Find projects where grantAllocation is one of these IDs"
            query.grantAllocation = { $in: allocationIds };
        }

        let dbQuery = Project.find(query);

        // 3. Deep Population
        if (filters.populate) {
            dbQuery = dbQuery
                .populate("applicant")
                .populate({
                    path: 'grantAllocation',
                    populate: [
                        { path: 'grant' },
                        { path: 'calendar' }
                    ]
                })

            //.populate("themes");
        }

        return dbQuery.lean<IProject[]>().exec();
    }

    async create(dto: CreateProjectDTO) {
        return Project.create({
            ...dto,
            grantAllocation: new mongoose.Types.ObjectId(dto.grantAllocation),
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            themes: dto.themes.map(thm => new mongoose.Types.ObjectId(thm)),
        });
    }

    async update(id: string, dtoData: UpdateProjectDTO["data"]): Promise<IProject | null> {
        const updateData: Partial<IProject> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.summary) updateData.summary = dtoData.summary;
        if (dtoData.totalBudget) updateData.totalBudget = dtoData.totalBudget;
        if (dtoData.totalDuration) updateData.totalDuration = dtoData.totalDuration;
        if (dtoData.themes) {
            updateData.themes = dtoData.themes.map(id => new mongoose.Types.ObjectId(id))
        }

        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async updateStatus(id: string, newStatus: ProjectStatus) {
        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsProjectDTO): Promise<boolean> {
        const query: any = {};
        const { applicant, grantAllocation } = filters;
        if (applicant) {
            query.applicant = new mongoose.Types.ObjectId(applicant);
        }
        if (grantAllocation) {
            query.grantAllocation = new mongoose.Types.ObjectId(grantAllocation);
        }
        const result = await Project.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Project.findByIdAndDelete(id).exec();
    }
}
