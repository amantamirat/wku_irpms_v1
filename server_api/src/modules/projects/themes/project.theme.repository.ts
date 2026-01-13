// projectTheme.repository.ts
import mongoose from "mongoose";
import { ProjectTheme, IProjectTheme } from "./project.theme.model";
import {
    CreateProjectThemeDTO, GetProjectThemeOptions
} from "./project.theme.dto";


export interface IProjectThemeRepository {
    findById(id: string): Promise<IProjectTheme | null>;
    find(filters: GetProjectThemeOptions): Promise<IProjectTheme[]>;
    create(dto: CreateProjectThemeDTO): Promise<IProjectTheme>;
    //update(id: string, data: UpdateProjectThemeDto["data"]): Promise<IProjectTheme>;
    createMany(dtos: CreateProjectThemeDTO[]): Promise<IProjectTheme[]>;
    delete(id: string): Promise<IProjectTheme | null>;
}

// MongoDB implementation
export class ProjectThemeRepository implements IProjectThemeRepository {

    async findById(id: string) {
        return ProjectTheme.findById(new mongoose.Types.ObjectId(id))
            .lean<IProjectTheme>()
            .exec();
    }

    async find(filters: GetProjectThemeOptions) {
        const query: any = {};
        if (filters.project) {
            query.project = new mongoose.Types.ObjectId(filters.project);
        }
        return ProjectTheme.find(query)
            .populate([
                { path: 'project' },
                { path: 'theme' }
            ])
            .lean<IProjectTheme[]>()
            .exec();
    }

    async create(dto: CreateProjectThemeDTO) {
        const data: Partial<IProjectTheme> = {
            project: new mongoose.Types.ObjectId(dto.project),
            theme: new mongoose.Types.ObjectId(dto.theme),
        };
        return ProjectTheme.create(data);
    }

    // bulk insert
    async createMany(dtos: CreateProjectThemeDTO[]) {
        const data: Partial<IProjectTheme>[] = dtos.map(dto => ({
            project: new mongoose.Types.ObjectId(dto.project),
            theme: new mongoose.Types.ObjectId(dto.theme),
        }));
        return ProjectTheme.insertMany(data, { ordered: true });
    }

    async delete(id: string) {
        return ProjectTheme.findByIdAndDelete(new mongoose.Types.ObjectId(id))
            .exec();
    }
}