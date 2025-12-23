import { DeleteDto } from "../../../util/delete.dto";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { PhaseType } from "./phase.enum";
import { IPhaseRepository, PhaseRepository } from "./phase.repository";

export class PhaseService {
    
    private repository: IPhaseRepository;
    private projectRepository: IProjectRepository;

    constructor(repository: IPhaseRepository = new PhaseRepository(),
        projectRepository?: IProjectRepository) {
        this.repository = repository;
        this.projectRepository = projectRepository || new ProjectRepository();
    }

    async create(dto: CreatePhaseDto) {
        if (dto.type !== PhaseType.phase)
            throw new Error("Operation not supported.");

        const projectDoc = await this.projectRepository.findById(dto.project);
        if (!projectDoc) throw new Error("Project not found");
        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Can not add phase on non pending projects.");

        if (String(projectDoc.leadPI) !== dto.applicantId)
            throw new Error("User not authorized. Lead PI not found.");

        return await this.repository.create(dto);
    }

    async getPhases(options: GetPhasesOptions) {
        return await this.repository.find(options);
    }

    async update(dto: UpdatePhaseDto) {
        const { id, data, applicantId: userId } = dto;
        
        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new Error("Phase not found");
        
        const projectDoc = await this.projectRepository.findById(String(phaseDoc.project));
        if (!projectDoc) throw new Error("Project not found");
        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Can not update phase on non pending projects.");
        
        return await this.repository.update(id, data);
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new Error("Phase not found");
        
        const projectDoc = await this.projectRepository.findById(String(phaseDoc.project));
        if (!projectDoc) throw new Error("Project not found");
        if (projectDoc.status !== ProjectStatus.pending)
            throw new Error("Can not update phase on non pending projects.");
        
        return await this.repository.delete(id);
    }
}
