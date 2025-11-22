// project.service.ts
import { IProjectRepository, ProjectRepository } from "./project.repository";
import {
    CreateProjectDTO,
    DeleteProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";

import { CacheService } from "../../util/cache/cache.service";
import { Cycle } from "../cycles/cycle.model";
import Applicant from "../applicants/applicant.model";
import { Collaborator } from "./collaborators/collaborator.model";

export class ProjectService {
    private repository: IProjectRepository;

    constructor(repository?: IProjectRepository) {
        this.repository = repository || new ProjectRepository();
    }
    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    async createProject(dto: CreateProjectDTO) {
        // Validate Cycle
        const cycle = await Cycle.findById(dto.cycleId).lean();
        if (!cycle) throw new Error("Cycle not found");
        // Validate Lead PI
        const leadPI = await Applicant.findOne({ user: dto.userId }).lean();
        if (!leadPI) throw new Error("Lead PI Applicant not found");

        // Ownership validation for PROGRAM cycles
        if (cycle.type === "Program") {
            await CacheService.validateOwnership(dto.userId, cycle.organization);
        }
        // Create via repository
        return this.repository.create({
            ...dto,
            leadPIId: String(leadPI._id)
        });
    }

   
    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------
    async getProjects(options: GetProjectsDTO) {
        const filter: any = {};

        if (options.userId) {
            const organizations = await CacheService.getUserOrganizations(options.userId);

            const cycles = await Cycle.find({
                organization: { $in: organizations }
            })
                .select("_id")
                .lean();

            filter.cycleId = cycles.map(c => String(c._id));
        }

        if (options.cycleId) filter.cycleId = options.cycleId;
        if (options.status) filter.status = options.status;

        return this.repository.find(filter);
    }

     // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async updateProject(dto: UpdateProjectDTO) {
        const existing = await this.repository.findById(dto.id);
        if (!existing) throw new Error("Project not found");

        // Only creator can update
        if (String(existing.createdBy) !== dto.userId) {
            throw new Error("Unauthorized: You cannot update this project.");
        }

        return this.repository.update(dto.id, dto.data);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async deleteProject(dto: DeleteProjectDTO) {
        const { id } = dto;
        const project = await this.repository.findById(id);
        if (!project) throw new Error("Project not found");

        // Only creator can delete
        if (project.createdBy.toString() !== dto.userId) {
            throw new Error("Unauthorized: You cannot delete this project.");
        }

        // Check collaborators
        const collaborator = await Collaborator.exists({ project: id });
        if (collaborator) {
            throw new Error(`Cannot delete: collaborator exists.`);
        }

        return this.repository.delete(dto.id);
    }
}
