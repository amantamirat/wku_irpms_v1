// collaborator.service.ts
import { DeleteDto } from "../../../util/delete.dto";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
} from "./collaborator.dto";
import { CollaboratorStatus } from "./collaborator.enum";
import { CollaboratorPermission } from "./collaborator.permission";
import { CollaboratorRepository, ICollaboratorRepository } from "./collaborator.repository";
import { CollaboratorStateMachine } from "./collaborator.state-machine";

export class CollaboratorService {
    private repository: ICollaboratorRepository;
    private projectRepository: IProjectRepository;
    private permission: CollaboratorPermission;

    constructor(repository: ICollaboratorRepository = new CollaboratorRepository(), projectRepository?: IProjectRepository) {
        this.repository = repository;
        this.projectRepository = projectRepository || new ProjectRepository();
        this.permission = new CollaboratorPermission(this.repository);
    }

    async createCollaborator(dto: CreateCollaboratorDto) {
        const { applicant, project, userId, isLeadPI, status } = dto;

        const projectDoc = this.projectRepository.findById(project);

        if (!projectDoc) throw new Error("Project not found");
        //if (!applicantExists) throw new Error("Applicant not found");

        const createdCollaborator = await this.repository.create(dto);
        return createdCollaborator;
    }

    async getCollaborators(options: GetCollaboratorsOptions) {
        if (!options.project && !options.applicant) {
            throw new Error("At least one filter option (project or applicant) must be provided");
        }
        const collaborators = await this.repository.find(options);
        return collaborators;
    }

    async updateCollaborator(dto: UpdateCollaboratorDto) {
        const updatedCollaborator = await this.repository.update(dto.id, dto.data);
        return updatedCollaborator;
    }

    async changeCollaboratorStatus(dto: UpdateCollaboratorDto) {
        const { id, data, userId } = dto;
        const collaboratorDoc = await this.repository.findById(id);
        if (!collaboratorDoc) throw new Error("Collaborator not found");
        const projectDoc = await this.projectRepository.findById(String(collaboratorDoc.project));
        if (!projectDoc) throw new Error("Project not found");
        const nextState = data.status;
        if (!nextState) throw new Error("Status is required");
        const current = collaboratorDoc.status;
        //if project state is deny here 

        // --- State Machine Validation ---
        CollaboratorStateMachine.validateTransition(current, nextState);
        // Permissions
        const isActivationChange = current === CollaboratorStatus.active || nextState === CollaboratorStatus.active;
        if (isActivationChange) {
            await this.permission.validateCollaboratorPermission(id, userId, collaboratorDoc);
        }
        const updated = await this.repository.update(dto.id, dto.data);
        return updated;
    }

    async deleteCollaborator(dto: DeleteDto) {
        const { id, userId } = dto;

        // Verify user can delete this collaborator
        //const canDelete = await repository.verifyUserCanDelete(id, userId);
        //  if (!canDelete) {
        //throw new Error("User not authorized to delete collaborator or collaborator is active");
        // }

        const deletedCollaborator = await this.repository.delete(id);
        if (!deletedCollaborator) throw new Error("Collaborator not found");

        return deletedCollaborator;
    }
}