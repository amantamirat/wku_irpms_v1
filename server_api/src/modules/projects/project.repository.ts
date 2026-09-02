// project.repository.ts
import mongoose, { ClientSession } from "mongoose";
import { FilterOptions } from "../../common/dtos/filter.dto";
import {
    CreateProjectDTO,
    FilterProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { IProject, Project, ProjectStatus } from "./project.model";

export interface IProjectRepository {
    findById(id: string, options?: FilterOptions): Promise<IProject | null>;
    find(filters: FilterProjectsDTO, options?: FilterOptions): Promise<Partial<IProject>[]>;
    create(dto: CreateProjectDTO): Promise<IProject>;
    update(id: string, data: UpdateProjectDTO["data"]): Promise<IProject | null>;
    updateStatus(id: string, newStatus: ProjectStatus): Promise<IProject | null>;
    incrementTotals(projectId: string, delta: { duration: number; budget: number }): Promise<IProject | null>;
    updateTotalCollabs(
        projectId: string,
        delta: number
    ): Promise<IProject | null>;
    updateCurrentApplication(
        id: string,
        application: string
    ): Promise<IProject | null>;
    clearCurrentApplication(
        project: string,
        session?: ClientSession
    ): Promise<IProject | null>;

    updateCurrentVerification(
        id: string,
        verification: string | null
    ): Promise<IProject | null>;
    clearCurrentVerification(
        project: string
    ): Promise<IProject | null>;
    exists(filters: FilterProjectsDTO): Promise<boolean>;
    delete(id: string): Promise<IProject | null>;
}

// MongoDB implementation
export class ProjectRepository implements IProjectRepository {

    async findById(
        id: string,
        options?: FilterOptions
    ): Promise<IProject | null> {
        let dbQuery = Project.findById(new mongoose.Types.ObjectId(id));

        if (options?.populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("calendar")
                .populate("grant")
                .populate("themes");
        }

        return dbQuery.lean<IProject>().exec();
    }

    async find(filters: FilterProjectsDTO, options?: FilterOptions) {
        const query: Record<string, any> = {};

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.leadPI) {
            query.leadPI = new mongoose.Types.ObjectId(filters.leadPI);
        }

        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }

        if (filters.call) {
            query.call = new mongoose.Types.ObjectId(filters.call);
        }

        if (filters.calendar) {
            query.calendar = new mongoose.Types.ObjectId(filters.calendar);
        }

        let dbQuery = Project.find(query);

        if (options?.populate) {
            dbQuery = dbQuery
                .populate("leadPI")
                .populate("grant")
                .populate("calendar")
                .populate("themes");
        }
        return dbQuery.lean<IProject[]>().exec();
    }
    async create(dto: CreateProjectDTO) {
        const data = {
            ...dto,
            calendar: dto.calendar ? new mongoose.Types.ObjectId(dto.calendar) : undefined,
            call: dto.call ? new mongoose.Types.ObjectId(dto.call) : undefined,
            grant: new mongoose.Types.ObjectId(dto.grant),
            leadPI: new mongoose.Types.ObjectId(dto.leadPI),
            themes: dto.themes?.map(thm => new mongoose.Types.ObjectId(thm)),
        };

        const created = await Project.create(data);

        return created;
    }

    async update(id: string, dtoData: UpdateProjectDTO["data"]): Promise<IProject | null> {
        const updateData: Partial<IProject> = {};

        if (dtoData.title) updateData.title = dtoData.title;
        if (dtoData.summary) updateData.summary = dtoData.summary;
        //if (dtoData.totalBudget) updateData.totalBudget = dtoData.totalBudget;
        //if (dtoData.totalDuration) updateData.totalDuration = dtoData.totalDuration;
        if (dtoData.themes) {
            updateData.themes = dtoData.themes.map(id => new mongoose.Types.ObjectId(id))
        }

        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async incrementTotals(
        projectId: string,
        delta: { duration: number; budget: number },
        session?: ClientSession
    ) {
        return Project.findByIdAndUpdate(
            projectId,
            {
                $inc: {
                    totalDuration: delta.duration,
                    totalBudget: delta.budget
                }
            },
            {
                session,          // <-- attach session here
                new: true         // optional: return updated document
            }
        );
    }

    async updateTotalCollabs(
        projectId: string,
        delta: number,
        session?: ClientSession
    ) {
        return Project.findByIdAndUpdate(
            projectId,
            {
                $inc: {
                    totalCollabs: delta
                }
            },
            {
                session,
                new: true
            }
        );
    }



    async updateStatus(
        id: string,
        newStatus: ProjectStatus,
        session?: ClientSession
    ) {
        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: { status: newStatus } },
            {
                new: true,
                session // attach session here
            }
        ).exec();
    }

    // ✅ add inside ProjectRepository
    async updateCurrentApplication(
        id: string,
        application: string
    ) {
        const update =

        {
            $set: {
                currentApplication: new mongoose.Types.ObjectId(application)
            }
        }


        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            update,
            {
                new: true
            }
        ).exec();
    }

    // ✅ add inside ProjectRepository
    async updateCurrentVerification(
        id: string,
        verification: string | null
    ) {
        const update =

        {
            $set: {
                currentVerification: verification ? new mongoose.Types.ObjectId(verification) : null
            }
        }
        return Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            update,
            {
                new: true
            }
        ).exec();
    }

    async clearCurrentApplication(
        project: string
    ) {
        let dbQuery = Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(project),
            {
                $unset: {
                    currentApplication: 1
                }
            },
            { new: true }
        );
        return dbQuery.exec();
    }


    async clearCurrentVerification(
        project: string
    ) {
        let dbQuery = Project.findByIdAndUpdate(
            new mongoose.Types.ObjectId(project),
            {
                $unset: {
                    currentVerification: 1
                }
            },
            { new: true }
        );
        return dbQuery.exec();
    }

    async exists(filters: FilterProjectsDTO): Promise<boolean> {
        const query: any = {};
        const { leadPI, grant, call, calendar, title } = filters;
        if (title) {
            query.title = title;
        }
        if (leadPI) {
            query.leadPI = new mongoose.Types.ObjectId(leadPI);
        }
        if (grant) {
            query.grant = new mongoose.Types.ObjectId(grant);
        }
        if (call) {
            query.call = new mongoose.Types.ObjectId(call);
        }
        if (calendar) {
            query.calendar = new mongoose.Types.ObjectId(calendar);
        }
        const result = await Project.exists(query).exec();
        return result !== null;
    }



    async delete(id: string) {
        return Project.findByIdAndDelete(id).exec();
    }
}
