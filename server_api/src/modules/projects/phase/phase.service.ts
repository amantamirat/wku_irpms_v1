import { DeleteDto } from "../../../util/delete.dto";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { PhaseType } from "./phase.enum";
import { IPhaseRepository, PhaseRepository } from "./phase.repository";
import { PhaseStateMachine } from "./phase.state-machine";
import { PhaseStatus } from "./phase.status";

export class PhaseService {

    private repository: IPhaseRepository;
    private projectRepository: IProjectRepository;

    constructor(repository: IPhaseRepository = new PhaseRepository(),
        projectRepository?: IProjectRepository) {
        this.repository = repository;
        this.projectRepository = projectRepository || new ProjectRepository();
    }

    async validate(project: string, applicant: string) {
        const projectDoc = await this.projectRepository.findById(project);

        if (!projectDoc)
            throw new Error("Project not found");

        if (String(projectDoc.leadPI) !== applicant)
            throw new Error("USER_NOT_LEAD_PI");

        const projectStatus = projectDoc.status;

        if (projectStatus !== ProjectStatus.pending &&
            projectStatus !== ProjectStatus.negotiation)
            throw new Error("PROJECT_STATUS_INVALID_FOR_PHASE_UPDATE");
    }

    async create(dto: CreatePhaseDto) {
        if (dto.type !== PhaseType.phase)
            throw new Error("Operation not supported.");

        await this.validate(dto.project, dto.applicantId);

        return await this.repository.create(dto);
    }

    async getPhases(options: GetPhasesOptions) {
        return await this.repository.find(options);
    }

    async update(dto: UpdatePhaseDto) {
        const { id, data, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new Error("Phase not found");

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new Error("PHASE_STATUS_INVALID_FOR_PHASE_UPDATE");

        await this.validate(String(phaseDoc.project), applicantId);

        return await this.repository.update(id, data);
    }
    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------
    async updateStatus(dto: UpdatePhaseDto) {
        const { id, data, applicantId } = dto;
        const next = data.status;
        if (!next) throw new Error("Status not found");

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new Error("Phase not found");

        const projectDoc = await this.projectRepository.findById(String(phaseDoc.project));
        if (!projectDoc) throw new Error("Project not found");

        if (projectDoc.status !== ProjectStatus.negotiation) {
            throw new Error("PROJECT_STATUS_INVALID_FOR_PHASE_UPDATE");
        }

        const current = phaseDoc.status;
        PhaseStateMachine.validateTransition(current, next);

        if (next === PhaseStatus.verified) {
            if (current === PhaseStatus.proposed) {
                if (String(projectDoc.leadPI) !== applicantId)
                    throw new Error("USER_NOT_LEAD_PI");
            }
        }

        const updated = await this.repository.update(id, { status: next });
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new Error("Phase not found");

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new Error("PHASE_STATUS_INVALID_FOR_PHASE_DELETE");

        await this.validate(String(phaseDoc.project), userId);
        return await this.repository.delete(id);
    }
}
