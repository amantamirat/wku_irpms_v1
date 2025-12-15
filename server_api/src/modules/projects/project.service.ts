// project.service.ts
import {
    CreateProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { IProjectRepository, ProjectRepository } from "./project.repository";

import { DeleteDto } from "../../util/delete.dto";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { CallRepository, ICallRepository } from "../calls/call.repository";
import { CollaboratorRepository, ICollaboratorRepository } from "./collaborators/collaborator.repository";

export class ProjectService {

    private repository: IProjectRepository;
    private callRepository: ICallRepository;
    private appRepository: IApplicantRepository;
    private collabRepository: ICollaboratorRepository;

    constructor(repository?: IProjectRepository) {
        this.repository = repository || new ProjectRepository();
        this.appRepository = new ApplicantRepository();
        this.callRepository = new CallRepository();
        this.collabRepository = new CollaboratorRepository();
    }

    async createProject(dto: CreateProjectDTO) {
        const callDoc = await this.callRepository.findById(dto.call);
        if (!callDoc) throw new Error("Call not found");
        const leadPIDoc = await this.appRepository.findOne({ id: dto.leadPI });
        if (!leadPIDoc) throw new Error("Lead PI Applicant not found");
        return this.repository.create(dto);
    }

    async getProjects(options: GetProjectsDTO) {
        return this.repository.find(options);
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async updateProject(dto: UpdateProjectDTO) {
        const { id, data, userId } = dto;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error("Project not found");

        if (String(projectDoc.leadPI) !== userId) {
            throw new Error("Unauthorized: You cannot update this project.");
        }
        return this.repository.update(dto.id, dto.data);
    }
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async deleteProject(dto: DeleteDto) {
        const { id } = dto;
        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error("Project not found");

        if (projectDoc.leadPI.toString() !== dto.userId) {
            throw new Error("Unauthorized: You cannot delete this project.");
        }

        const collaborators = await this.collabRepository.find({ project: id });

        if (collaborators.length > 0) {
            throw new Error(`Cannot delete:  ${collaborators.length} collaborators exists.`);
        }
        return this.repository.delete(dto.id);
    }
}
