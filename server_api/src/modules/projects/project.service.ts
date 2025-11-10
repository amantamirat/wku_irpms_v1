import mongoose from "mongoose";
import { CacheService } from "../../util/cache/cache.service";
import { Cycle } from "../cycles/cycle.model";
import {
    CreateProjectDto,
    UpdateProjectDto,
    GetProjectsOptions,
    DeleteProjectDto
} from "./project.dto";
import { Project } from "./project.model";
import { ProjectStatus } from "./project.enum";
import { Collaborator } from "./collaborators/collaborator.model";

export class ProjectService {  


    static async createProject(dto: CreateProjectDto) {
        const cycle = await Cycle.findById(dto.cycle).lean();
        if (!cycle) throw new Error("Cycle not found");
        // ensure user belongs to cycle's organization
        await CacheService.validateOwnership(dto.userId, cycle.organization);
        const project = await Project.create({
            ...dto,
            createdBy: new mongoose.Types.ObjectId(dto.userId)
        });
        return project;
    }
    
    static async updateProject(dto: UpdateProjectDto) {
        const { id, data, userId } = dto;
        const project = await Project.findById(id);
        if (!project) throw new Error("Project not found");

        const cycle = await Cycle.findById(project.cycle).lean();
        if (!cycle) throw new Error("Cycle not found");
        await CacheService.validateOwnership(userId, cycle.organization);

        Object.assign(project, data);
        return project.save();
    }

   
    static async getProjects(options: GetProjectsOptions) {
        const filter: any = {};
        if (options.userId) {
            const organizations = await CacheService.getUserOrganizations(options.userId);
            const cycles = await Cycle.find({ organization: { $in: organizations } }).select('_id').lean();
            filter.cycle = { $in: cycles.map(c => c._id) };
        }
        if (options.cycle) filter.cycle = options.cycle;
        if (options.status) filter.status = options.status;

        return await Project.find(filter).populate([{ path: 'cycle' }]).lean();
    }

    // -----------------------
    // Delete
    // -----------------------
    static async deleteProject(dto: DeleteProjectDto) {
        const { id, userId } = dto;
        const project = await Project.findById(id);
        if (!project) throw new Error("Project not found");

        const cycle = await Cycle.findById(project.cycle).lean();
        if (!cycle) throw new Error("Cycle not found");
        await CacheService.validateOwnership(userId, cycle.organization);

        const collaborator = await Collaborator.exists({ project: project._id });
        if (collaborator) throw new Error(`Cannot delete: ${project.title} collaborator exist.`);

        return await project.deleteOne();
    }
}


