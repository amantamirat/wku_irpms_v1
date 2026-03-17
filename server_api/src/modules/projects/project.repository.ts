// project.repository.ts
import mongoose from "mongoose";
import { Project, IProject } from "./project.model";
import {
    CreateProjectDTO,
    ExistsProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";


export interface IProjectRepository {
    findById(id: string): Promise<IProject | null>;
    find(filters: GetProjectsDTO): Promise<Partial<IProject>[]>;
    create(dto: CreateProjectDTO): Promise<IProject>;
    update(id: string, data: UpdateProjectDTO["data"]): Promise<IProject | null>;
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

        if (filters.grant) {
            query.call = new mongoose.Types.ObjectId(filters.grant);
        }

        if (filters.applicant) {
            query.applicant = new mongoose.Types.ObjectId(filters.applicant);
        }

        if (filters.status) {
            query.status = filters.status;
        }

        let dbQuery = Project.find(query);

        /**
         * 
         * if (filters.populate) {
            dbQuery = dbQuery.populate([
                {
                    path: 'grant',
                    match: filters.directorate
                        ? { directorate: new mongoose.Types.ObjectId(filters.directorate) }
                        : undefined,
                    populate: {
                        path: 'directorate calendar'
                    }
                },
                {
                    path: 'applicant',
                    match: filters.workspace
                        ? { workspace: new mongoose.Types.ObjectId(filters.workspace) }
                        : undefined,
                    populate: {
                        path: 'workspace'
                    }
                }
            ]);
        }
         */

        if (filters.populate) {
            dbQuery
                .populate("grant")
                .populate("applicant")
        }

        const result = await dbQuery
            .lean<IProject[]>()
            .exec();

        // Remove unmatched populated docs
        return result.filter(p =>
            (!filters.directorate || p.grant) &&
            (!filters.workspace || p.applicant)
        );
    }

    async create(dto: CreateProjectDTO) {
        return Project.create({
            ...dto,
            grant: new mongoose.Types.ObjectId(dto.grant),
            applicant: new mongoose.Types.ObjectId(dto.applicant)
        });
    }

    async update(id: string, dtoData: UpdateProjectDTO["data"]): Promise<IProject | null> {
        const updateData: Partial<IProject> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.summary) updateData.summary = dtoData.summary;
        if (dtoData.totalBudget) updateData.totalBudget = dtoData.totalBudget;
        if (dtoData.totalDuration) updateData.totalDuration = dtoData.totalDuration;
        if (dtoData.status) updateData.status = dtoData.status;

        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsProjectDTO): Promise<boolean> {
        const query: any = {};
        const { applicant, grant: call } = filters;
        if (applicant) {
            query.applicant = new mongoose.Types.ObjectId(applicant);
        }
        if (call) {
            query.call = new mongoose.Types.ObjectId(call);
        }
        const result = await Project.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Project.findByIdAndDelete(id).exec();
    }
}
