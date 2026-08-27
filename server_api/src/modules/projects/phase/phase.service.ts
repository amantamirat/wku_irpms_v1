import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ICallRepository } from "../../calls/call.repository";
import { ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { IGrantRepository } from "../../grants/grant.repository";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { CreatePhaseDto, GetPhasesOptions, UpdatePhaseDto } from "./phase.dto";
import { PhaseStatus } from "./phase.model";
import { IPhaseRepository } from "./phase.repository";
import { PhaseSynchronizer } from "./phase.synchronizer";

export class PhaseService {

    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projRepo: IProjectRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly constraintValidator: ConstraintValidationService,
        private readonly synchronizer: PhaseSynchronizer,
    ) { }

    async validateProject(project: string) {
        const projectDoc = await this.projRepo.findById(project);
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }
        if (
            projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.approved
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }

    async create(dto: CreatePhaseDto, options?: { skipValidation?: boolean }) {
        const { project, userId } = dto;
        if (!options?.skipValidation) {
            const projectDoc = await this.validateProject(project);

            if (projectDoc.call) {
                const callDoc = await this.callRepo.findById(String(projectDoc.call));
                if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

                if (callDoc.constraint) {
                    const existingPhases = await this.phaseRepo.find({ project });
                    const proposedPhases = [...existingPhases, dto];

                    const validationResult =
                        await this.constraintValidator.validatePhases(
                            String(callDoc.constraint),
                            proposedPhases
                        );

                    if (!validationResult.valid) {
                        throw new AppError(
                            ERROR_CODES.INVALID_CONSTRAINT,
                            "invalid phases",
                            400,
                            validationResult
                        );
                    }
                }
            }
        }
        try {
            const lastPhase = await this.phaseRepo.findLastPhase(project);

            const order = lastPhase
                ? lastPhase.order + 1
                : 1;

            const created = await this.phaseRepo.create({
                ...dto,
                order
            });
            if (created) {
                await this.projRepo.incrementTotals(project, {
                    duration: created.duration ?? 0,
                    budget: created.budget ?? 0
                });
            }
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PHASE_ALREADY_EXISTS);
            }

            throw err;
        }
    }

    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------
    async getPhases(options: GetPhasesOptions) {
        return await this.phaseRepo.find(options);
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdatePhaseDto) {
        const { id, data, userId } = dto;

        const phaseDoc = await this.phaseRepo.findById(id);

        if (!phaseDoc)
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const projectId = String(phaseDoc.project);

        const projectDoc = await this.validateProject(projectId);

        if (projectDoc.call) {
            const callDoc = await this.callRepo.findById(String(projectDoc.call));
            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
            if (callDoc.constraint) {
                const updatedPhase = { ...phaseDoc, ...data };
                const existingPhases = await this.phaseRepo.find({ project: projectId });
                const updatedPhases = existingPhases.map(p => String(p._id) === id ? updatedPhase : p);
                const validationResult = await this.constraintValidator.validatePhases(String(callDoc.constraint), updatedPhases);
                if (!validationResult.valid) {
                    throw new AppError(ERROR_CODES.INVALID_CONSTRAINT,
                        "invalid phases", 400, validationResult);
                }
            }
        }

        const oldDuration = phaseDoc.duration ?? 0;
        const oldBudget = phaseDoc.budget ?? 0;

        const updated = await this.phaseRepo.update(id, data);

        const newDuration = updated?.duration ?? 0;
        const newBudget = updated?.budget ?? 0;

        // Adjust totals (delta)
        await this.projRepo.incrementTotals(
            projectId,
            {
                duration: newDuration - oldDuration,
                budget: newBudget - oldBudget
            }
        );

        return updated;
    }

    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------
    async transitionState(dto: TransitionRequestDto) {

        const { id, next, current } = dto;

        const currentPhaseDoc = await this.phaseRepo.findById(id);

        if (!currentPhaseDoc)
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const from = currentPhaseDoc.status as PhaseStatus;
        const to = next as PhaseStatus;

        if (current && current !== from)
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);

        TransitionHelper.validateTransition(
            from,
            to,
            PHASE_TRANSITIONS
        );

        const projectId = String(currentPhaseDoc.project);

        const projectDoc = await this.projRepo.findById(projectId);

        if (!projectDoc)
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (projectDoc.currentVerification)
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS, "A verification already exists for this project.");

        const projectStatus = projectDoc.status;

        const prevPhase = await this.phaseRepo.findPreviousPhase(
            projectId,
            currentPhaseDoc.order
        );

        const nextPhase = await this.phaseRepo.findNextPhase(
            projectId,
            currentPhaseDoc.order
        );

        const isFirstPhase = !prevPhase;
        //const isLastPhase = !nextPhase;

        /**
         * PROPOSED <-> APPROVED
         */
        if (
            (from === PhaseStatus.proposed && to === PhaseStatus.approved)
            || (from === PhaseStatus.approved && to === PhaseStatus.proposed)
        ) {
            if (projectStatus !== ProjectStatus.approved)
                throw new AppError(ERROR_CODES.PROJECT_NOT_APPROVED);

            /*
            if (
                prevPhase &&
                prevPhase.status !== PhaseStatus.approved
            ) {
                throw new AppError(ERROR_CODES.PREVIOUS_PHASE_NOT_APPROVED);
            }

            if (
                nextPhase &&
                nextPhase.status !== PhaseStatus.proposed
            ) {
                throw new AppError(ERROR_CODES.NEXT_PHASE_NOT_PROPSED);
            }
                */
        }

        else if (to === PhaseStatus.active || to === PhaseStatus.approved) {

            if (
                prevPhase &&
                prevPhase.status !== PhaseStatus.completed
            ) {
                throw new AppError(ERROR_CODES.PREVIOUS_PHASE_NOT_COMPLETED);
            }
            if (
                nextPhase &&
                nextPhase.status !== PhaseStatus.approved
            ) {
                throw new AppError(ERROR_CODES.NEXT_PHASE_NOT_APPROVED);
            }

            if (
                from === PhaseStatus.approved &&
                to === PhaseStatus.active
            ) {

                if (isFirstPhase) {
                    if (projectStatus !== ProjectStatus.granted)
                        throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);
                }

                await this.grantRepo.consumeBudget(
                    projectDoc.grant.toString(),
                    currentPhaseDoc.budget
                );
            }

            else if (
                from === PhaseStatus.active &&
                to === PhaseStatus.approved
            ) {

                await this.grantRepo.reverseConsumedBudget(
                    projectDoc.grant.toString(),
                    currentPhaseDoc.budget
                );
            }
        }
        /**
         * UPDATE PHASE
         */
        const updated = await this.phaseRepo.updateStatus(
            id,
            to
        );
        if (updated) {
            await this.synchronizer.sync(projectId);
        }
        return updated;
    }
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const projectId = String(phaseDoc.project);
        const projectDoc = await this.validateProject(projectId);
        if (projectDoc.call) {
            const callDoc = await this.callRepo.findById(String(projectDoc.call));
            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

            if (callDoc.constraint) {
                const existingPhases =
                    await this.phaseRepo.find({
                        project: projectId
                    });

                // Remove the phase that is going to be deleted
                const remainingPhases = existingPhases.filter(
                    phase => String(phase._id) !== id
                );

                const validationResult =
                    await this.constraintValidator.validatePhases(
                        String(callDoc.constraint),
                        remainingPhases
                    );

                if (!validationResult.valid) {
                    throw new AppError(
                        ERROR_CODES.INVALID_CONSTRAINT,
                        "invalid phases",
                        400,
                        validationResult
                    );
                }
            }
        }
        // ✅ Decrement totals BEFORE delete
        await this.projRepo.incrementTotals(projectId, {
            duration: -(phaseDoc.duration ?? 0),
            budget: -(phaseDoc.budget ?? 0)
        });
        const deleted = await this.phaseRepo.delete(id);

        // Re-arrange orders of remaining phases
        if (deleted) {
            await this.phaseRepo.updateMany(
                {
                    projectId,
                    order: { $gt: phaseDoc.order }
                },
                {
                    $inc: { order: -1 }
                }
            );
        }
        return deleted;
    }
}

export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
    [PhaseStatus.proposed]: [
        PhaseStatus.approved
    ],

    [PhaseStatus.approved]: [
        PhaseStatus.active,
        PhaseStatus.proposed
    ],

    [PhaseStatus.active]: [
        PhaseStatus.completed,
        PhaseStatus.terminated,
        PhaseStatus.approved
    ],

    [PhaseStatus.completed]: [
        PhaseStatus.active
    ],

    [PhaseStatus.terminated]: [
        PhaseStatus.active
    ]
};