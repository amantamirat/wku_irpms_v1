import mongoose from "mongoose";
import { CacheService } from "../../util/cache/cache.service";
import { Cycle } from "../cycles/cycle.model";
import { Collaborator } from "./collaborators/collaborator.model";
import {
    CreateProjectDto,
    DeleteProjectDto,
    GetProjectsOptions,
    UpdateProjectDto
} from "./project.dto";
import { Project } from "./project.model";
import Applicant from "../applicants/applicant.model";

export class ProjectService {


    static async createProject(dto: CreateProjectDto) {
        const cycle = await Cycle.findById(dto.cycle).lean();
        if (!cycle) throw new Error("Cycle not found");
        const leadPI = await Applicant.findOne({ user: dto.userId }).lean();
        if (!leadPI) throw new Error("Lead PI Applicant Not found");
        if (cycle.type === "Program") {
            await CacheService.validateOwnership(dto.userId, cycle.organization);
        }
        const project = await Project.create({
            ...dto,
            leadPI: leadPI._id,
            createdBy: new mongoose.Types.ObjectId(dto.userId)
        });
        return project;
    }

    static async updateProject(dto: UpdateProjectDto) {
        const { id, data, userId } = dto;
        const project = await Project.findById(id);
        if (!project) throw new Error("Project not found");

        const createdBy = project.createdBy.toString();
        if (createdBy !== userId) {
            throw new Error("Unauthorized: You do not have permission to update this project.");
        }
        //const cycle = await Cycle.findById(project.cycle).lean();
        //if (!cycle) throw new Error("Cycle not found");
        //await CacheService.validateOwnership(userId, cycle.organization);

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
        const createdBy = project.createdBy.toString();
        if (createdBy !== userId) {
            throw new Error("Unauthorized: You do not have permission to delete this project.");
        }
        /*
                const cycle = await Cycle.findById(project.cycle).lean();
                if (!cycle) throw new Error("Cycle not found");
                await CacheService.validateOwnership(userId, cycle.organization);
        */
        const collaborator = await Collaborator.exists({ project: project._id });
        if (collaborator) throw new Error(`Cannot delete: ${project.title} collaborator exist.`);

        return await project.deleteOne();
    }
}


