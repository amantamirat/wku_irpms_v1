import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IProjectRepository, ProjectRepository } from "../project.repository";
import { ProjectStatus } from "../project.state-machine";
import { CreatePhaseDto, GetPhasesOptions, PhaseBreakdownDto, UpdatePhaseDto } from "./phase.dto";
import { IPhaseRepository, PhaseRepository } from "./phase.repository";
import { PHASE_TRANSITIONS } from "./phase.state-machine";
import { PhaseStatus } from "./phase.status";

export class PhaseService {
    constructor(
        private readonly repository: IPhaseRepository = new PhaseRepository(),
        private readonly projectRepository: IProjectRepository = new ProjectRepository()
    ) {}

    /**
     * Internal Helper: Validates that breakdown totals match the Phase totals.
     */
    private validateBreakdown(dto: { duration: number; budget: number; breakdown?: PhaseBreakdownDto[] }) {
        if (!dto.breakdown || dto.breakdown.length === 0) return;

        const totalDuration = dto.breakdown.reduce((sum, item) => sum + item.duration, 0);
        const totalBudget = dto.breakdown.reduce((sum, item) => sum + item.budget, 0);

        if (totalDuration !== dto.duration) {
            throw new AppError(ERROR_CODES.INVALID_PHASE_DURATION_SUM);
        }
        if (totalBudget !== dto.budget) {
            throw new AppError(ERROR_CODES.INVALID_PHASE_BUDGET_SUM);
        }
    }

    async validate(project: string, applicantId: string) {
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        // Standard Ownership Check
        if (String(projectDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        // Phases can only be modified during Draft or Negotiation
        if (projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
    }

    async create(dto: CreatePhaseDto) {
        const { project, applicantId } = dto;
        
        await this.validate(project, applicantId ?? "");
        this.validateBreakdown(dto); // Ensure math adds up

        try {
            return await this.repository.create(dto);
        }
        catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PHASE_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getPhases(options: GetPhasesOptions) {
        return await this.repository.find(options);
    }

    async update(dto: UpdatePhaseDto) {
        const { id, data, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        
        const projectId = String(phaseDoc.project);
        await this.validate(projectId, applicantId);

        // Logic check: Phases in progress shouldn't be edited easily
        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        // If breakdown is being updated, we must re-validate the sums
        if (data.breakdown || data.budget || data.duration) {
            this.validateBreakdown({
                duration: data.duration ?? phaseDoc.duration,
                budget: data.budget ?? phaseDoc.budget,
                breakdown: data.breakdown ?? phaseDoc.breakdown
            });
        }

        return await this.repository.update(id, data);
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, next, applicantId, current } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const from = phaseDoc.status as PhaseStatus;
        const to = next as PhaseStatus;

        if (current && current !== from) throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);

        TransitionHelper.validateTransition(from, to, PHASE_TRANSITIONS);

        const projectDoc = await this.projectRepository.findById(String(phaseDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        
        const projectStatus = projectDoc.status;        

        // Business Logic for specific transitions
        if (to === PhaseStatus.reviewed) {
            if (projectStatus !== ProjectStatus.negotiation)
                throw new AppError(ERROR_CODES.PROJECT_NOT_IN_NEGOTIATION);

            // Lead PI
            if (String(projectDoc.applicant) !== applicantId)
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        if (to === PhaseStatus.active) {
            if (projectStatus !== ProjectStatus.granted)
                throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);
        }

        return await this.repository.update(id, { status: to });
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        await this.validate(String(phaseDoc.project), applicantId ?? "");

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        return await this.repository.delete(id);
    }
}