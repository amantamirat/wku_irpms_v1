import { DeleteDto } from "../../../util/delete.dto";
import { IProjectRepository, ProjectRepository } from "../project.repository";
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

    async createPhase(dto: CreatePhaseDto) {
        if (dto.type !== PhaseType.phase) {
            throw new Error("Operation not supported.");
        }
        const project = await this.projectRepository.findById(dto.project);
        if (!project) throw new Error("Project not found");
        return await this.repository.create(dto);
    }

    async getPhases(options: GetPhasesOptions) {
        return await this.repository.find(options);
    }

    async updatePhase(dto: UpdatePhaseDto) {
        const { id, data, userId } = dto;
        return await this.repository.update(id, data);
    }

    async deletePhase(dto: DeleteDto) {
        const { id, userId } = dto;        
        return await this.repository.delete(id);
    }
}
