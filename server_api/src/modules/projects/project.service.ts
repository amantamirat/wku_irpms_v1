// project.service.ts
import {
    CreateProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { IProjectRepository, ProjectRepository } from "./project.repository";

import { CacheService } from "../../util/cache/cache.service";
import { DeleteDto } from "../../util/delete.dto";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { Call } from "../calls/call.model";
import { CallRepository, ICallRepository } from "../calls/call.repository";
import { Collaborator } from "./collaborators/collaborator.model";

export class ProjectService {

    private repository: IProjectRepository;
    private callRepository: ICallRepository;
    private appRepository: IApplicantRepository;

    constructor(repository?: IProjectRepository) {
        this.repository = repository || new ProjectRepository();
        this.appRepository = new ApplicantRepository();
        this.callRepository = new CallRepository();
    }
   
    async createProject(dto: CreateProjectDTO) {
        const callDoc = await this.callRepository.findById(dto.call);
        if (!callDoc) throw new Error("Cycle not found");
        const leadPIDoc = await this.appRepository.find({ id: dto.leadPI });
        if (!leadPIDoc) throw new Error("Lead PI Applicant not found");
        return this.repository.create(dto);
    }

    async getProjects(options: GetProjectsDTO) {
        const filter: any = {};

        if (options.leadPI) {
            const organizations = await CacheService.getUserOrganizations(options.leadPI);

            const cycles = await Call.find({
                directorate: { $in: organizations }
            })
                .select("_id")
                .lean();

            filter.cycleId = cycles.map(c => String(c._id));
        }

        if (options.call) filter.cycleId = options.call;
        if (options.status) filter.status = options.status;

        return this.repository.find(filter);
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async updateProject(dto: UpdateProjectDTO) {
        const existing = await this.repository.findById(dto.id);
        if (!existing) throw new Error("Project not found");
        /**
         * // Only creator can update
        if (String(existing.createdBy) !== dto.userId) {
            throw new Error("Unauthorized: You cannot update this project.");
        }
         */
        return this.repository.update(dto.id, dto.data);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async deleteProject(dto: DeleteDto) {
        const { id } = dto;
        const project = await this.repository.findById(id);
        if (!project) throw new Error("Project not found");

        /**
         * // Only creator can delete
        if (project.createdBy.toString() !== dto.userId) {
            throw new Error("Unauthorized: You cannot delete this project.");
        }
         */

        // Check collaborators
        const collaborator = await Collaborator.exists({ project: id });
        if (collaborator) {
            throw new Error(`Cannot delete: collaborator exists.`);
        }

        return this.repository.delete(dto.id);
    }
}
