// project.service.ts
import {
    CreateProjectDTO,
    GetProjectsDTO,
    UpdateProjectDTO,
    UpdateStatusDTO
} from "./project.dto";
import { IProjectRepository, ProjectRepository } from "./project.repository";

import { DeleteDto } from "../../util/delete.dto";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { CallRepository, ICallRepository } from "../calls/call.repository";
import { CollaboratorRepository, ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { ProjectStatus } from "./project.status";
import { CallStatus } from "../calls/call.status";
import { ProjectStateMachine } from "./project.state-machine";

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

    async create(dto: CreateProjectDTO) {
        const callDoc = await this.callRepository.findById(dto.call);
        if (!callDoc) throw new Error("Call not found");
        if (callDoc.status !== CallStatus.active) throw new Error("Call is not active");
        const leadPIDoc = await this.appRepository.findOne({ id: dto.applicantId });
        if (!leadPIDoc) throw new Error("Lead PI not found");
        return this.repository.create(dto);
    }

    //based on ownerships // and collaborations // and pi
    async getProjects(options: GetProjectsDTO) {
        return this.repository.find(options);
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO) {
        const { id, data, applicantId: userId } = dto;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error("Project not found");

        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Project not is not pending");

        if (String(projectDoc.leadPI) !== userId) {
            throw new Error("Unauthorized: You cannot update this project.");
        }
        return this.repository.update(dto.id, dto.data);
    }

    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------

    async updateStatus(dto: UpdateStatusDTO) {
        const { id, status } = dto.data;
        const next = status;

        const projectDoc = await this.repository.findById(id);
        if (!projectDoc) throw new Error("Project not found");
        const current = projectDoc.status;

        ProjectStateMachine.validateTransition(current, next);
        const updated = await this.repository.update(id, { status: next });
        return updated;

    }
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async deleteProject(dto: DeleteDto) {
        const { id } = dto;
        const projectDoc = await this.repository.findById(id);
        if (!projectDoc)
            throw new Error("Project not found");

        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Project not is not pending");

        if (String(projectDoc.leadPI) !== dto.userId) {
            throw new Error("Unauthorized: You cannot delete this project.");
        }
        /*
        const collaborators = await this.collabRepository.find({ project: id });
        if (collaborators.length > 0) {
            throw new Error(`Cannot delete:  ${collaborators.length} collaborators exists.`);
        }
        */
        return this.repository.delete(dto.id);
    }
}
