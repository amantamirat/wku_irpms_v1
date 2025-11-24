// collaborator.service.ts
import { DeleteDto } from "../../../util/delete.dto";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
} from "./collaborator.dto";
import { CollaboratorRepository, ICollaboratorRepository } from "./collaborator.repository";

export class CollaboratorService {
    private repository: ICollaboratorRepository;
    private projectRepository: IProjectRepository;

    constructor(repository: ICollaboratorRepository = new CollaboratorRepository(), projectRepository?: IProjectRepository) {
        this.repository = repository;
        this.projectRepository = projectRepository || new ProjectRepository();
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