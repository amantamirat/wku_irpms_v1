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
    ) { }

    /**
     * Internal Helper: Derives duration and budget from the breakdown.
     * If no breakdown is provided, it defaults to the existing values or zero.
     */
    private calculateTotals(data: any, existingDoc?: any) {
        const breakdown = data.breakdown || existingDoc?.breakdown || [];

        // Ensure there is at least one activity if we are in detailed-only mode
        if (breakdown.length === 0) {
            throw new AppError(ERROR_CODES.INVALID_PHASE_BREAKDOWN); // Ensure this error code exists
        }

        const totalDuration = breakdown.reduce((sum: number, item: any) => sum + (item.duration || 0), 0);
        const totalBudget = breakdown.reduce((sum: number, item: any) => sum + (item.budget || 0), 0);

        return {
            ...data,
            duration: totalDuration,
            budget: totalBudget
        };
    }

    async validate(project: string, applicantId: string) {
        const projectDoc = await this.projectRepository.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
    }

    async create(dto: CreatePhaseDto) {
        const { project, applicantId } = dto;

        await this.validate(project, applicantId ?? "");

        // Calculate totals based on breakdown activities before saving
        const dataToSave = this.calculateTotals(dto);

        try {
            return await this.repository.create(dataToSave);
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

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        // Recalculate totals if the breakdown is being updated
        let updatedData = { ...data };
        if (data.breakdown) {
            updatedData = this.calculateTotals(data, phaseDoc);
        }

        return await this.repository.update(id, updatedData);
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

        return await this.repository.updateStatus(id, to);
    }

    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const phaseDoc = await this.repository.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        //include reoredring here 
        await this.validate(String(phaseDoc.project), applicantId ?? "");

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        return await this.repository.delete(id);
    }
}