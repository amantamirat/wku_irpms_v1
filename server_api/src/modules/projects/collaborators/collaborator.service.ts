// collaborator.service.ts
import { DeleteDto } from "../../../util/delete.dto";
import { ApplicantRepository, IApplicantRepository } from "../../applicants/applicant.repository";
import { ProjectStatus } from "../project.status";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
} from "./collaborator.dto";
import { CollaboratorRepository, ICollaboratorRepository } from "./collaborator.repository";
import { CollaboratorStateMachine } from "./collaborator.state-machine";
import { CollaboratorStatus } from "./collaborator.status";

export class CollaboratorService {
    private repository: ICollaboratorRepository;
    private projectRepository: IProjectRepository;
    private applicantRepo: IApplicantRepository;
    //private permission: CollaboratorPermission;

    constructor(repository: ICollaboratorRepository = new CollaboratorRepository(),
        projectRepository?: IProjectRepository, applicantRepo?: IApplicantRepository) {
        this.repository = repository;
        this.projectRepository = projectRepository || new ProjectRepository();
        this.applicantRepo = applicantRepo || new ApplicantRepository();
        //this.permission = new CollaboratorPermission(this.repository);
    }

    async createCollaborator(dto: CreateCollaboratorDto) {
        const { applicant, project, leadPI: applicantId, isLeadPI, status } = dto;
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new Error("Project not found");
        if (projectDoc.status !== ProjectStatus.pending) {
            throw new Error("Can not add collaborators on non pending projects.");
        }
        if (String(projectDoc.leadPI) !== applicantId) {
            throw new Error("User not authorized. Lead PI not found.");
        }
        const appDoc = await this.applicantRepo.findOne({ id: applicant });
        if (!appDoc) throw new Error("Applicant not found");
        const created = await this.repository.create(dto);
        return created;
    }

    async getCollaborators(options: GetCollaboratorsOptions) {
        if (!options.project && !options.applicant) {
            throw new Error("At least one filter option (project or applicant) must be provided");
        }
        const collaborators = await this.repository.find(options);
        return collaborators;
    }

    /*
    async updateCollaborator(dto: UpdateCollaboratorDto) {
        const updated = await this.repository.update(dto.id, dto.data);
        return updated;
    }
    */

    async updateStatus(dto: UpdateCollaboratorDto) {
        const { id, data, applicantId } = dto;
        const collabDoc = await this.repository.findById(id);
        if (!collabDoc) throw new Error("Collaborator not found");

        const projectDoc = await this.projectRepository.findById(String(collabDoc.project));
        if (!projectDoc) throw new Error("Project not found");

        const projectStatus = projectDoc.status;
        if (projectStatus !== ProjectStatus.pending &&
            projectStatus !== ProjectStatus.submitted &&
            projectStatus !== ProjectStatus.accepted &&
            projectStatus !== ProjectStatus.negotiation
        ) {
            throw new Error("INVALID_PROJECT_STATUS_FOR_COLLABORATOR_UPDATE");
        }

        const nextState = data.status;
        if (!nextState) throw new Error("Status is required");

        if (String(collabDoc.applicant) !== applicantId) {
            throw new Error(`User not authorized to perform ${nextState}`);
        }
        const current = collabDoc.status;
        // --- State Machine Validation ---
        CollaboratorStateMachine.validateTransition(current, nextState);

        const updated = await this.repository.update(dto.id, dto.data);
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;

        const collaboratorDoc = await this.repository.findById(id);
        if (!collaboratorDoc) throw new Error("Collaborator not found");

        const projectDoc = await this.projectRepository.findById(String(collaboratorDoc.project));
        if (!projectDoc) throw new Error("Project not found");
        if (projectDoc.status !== ProjectStatus.pending) {
            throw new Error("Can not remove collaborators on non pending projects.");
        }
        if (String(projectDoc.leadPI) !== userId) {
            throw new Error("User not authorized. Lead PI not found.");
        }

        const deleted = await this.repository.delete(id);
        return deleted;
    }
}