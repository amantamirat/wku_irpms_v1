import { SYSTEM } from "../../../common/constants/system.constant";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../util/delete.dto";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.status";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto, UpdatePhaseStatusDto } from "./phase.dto";
import { IPhaseRepository, PhaseRepository } from "./phase.repository";
import { PhaseStateMachine } from "./phase.state-machine";
import { PhaseStatus } from "./phase.status";

export class PhaseService {

    constructor(
        private readonly repository: IPhaseRepository = new PhaseRepository(),
        private readonly projectRepository: IProjectRepository = new ProjectRepository()
    ) { }

    async validate(project: string, applicantId: string) {

        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.leadPI) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.pending &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
    }

    async create(dto: CreatePhaseDto) {
        const { project, applicantId } = dto;

        this.validate(project ?? "", applicantId ?? "");

        return await this.repository.create(dto);
    }

    async getPhases(options: GetPhasesOptions) {
        return await this.repository.find(options);
    }

    async update(dto: UpdatePhaseDto) {
        const { id, data, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        await this.validate(String(phaseDoc.project), applicantId);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        return await this.repository.update(id, data);
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new Error(ERROR_CODES.PHASE_NOT_FOUND);

        await this.validate(String(phaseDoc.project), applicantId);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        return await this.repository.delete(id);
    }
    // ---------------------------------------------------
    // UPDATE STATUS
    // ---------------------------------------------------
    async updateStatus(dto: UpdatePhaseStatusDto) {
        const { id, status, applicantId } = dto;
        const next = status;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const projectDoc = await this.projectRepository.findById(String(phaseDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        const projectStatus = projectDoc.status;

        const current = phaseDoc.status;
        // --- State Machine Validation ---
        PhaseStateMachine.validateTransition(current, next);

        if (next === PhaseStatus.reviewed) {
            if (projectStatus !== ProjectStatus.negotiation) 
                throw new AppError(ERROR_CODES.PROJECT_NOT_IN_NEGOTIATION);
            
            if (current === PhaseStatus.proposed) {
                if (String(projectDoc.leadPI) !== applicantId && SYSTEM.SU_USER !== applicantId)
                    throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);
            }
        }
        
        if (next === PhaseStatus.active) {
            if (projectStatus !== ProjectStatus.granted) 
                throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);   
        }

        const updated = await this.repository.update(id, { status: next });
        return updated;
    }


}
