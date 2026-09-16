import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ICallRepository } from "../../calls/call.repository";
import { ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { IGrantRepository } from "../../grants/grant.repository";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { CreatePhaseDto, FilterPhases, UpdatePhaseDto } from "./phase.dto";
import { PhaseStatus } from "./phase.model";
import { IPhaseRepository } from "./phase.repository";
import { PhaseSynchronizer } from "./phase.synchronizer";

export class PhaseService {

    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly constraintValidator: ConstraintValidationService,
        private readonly projectAuth: ProjectAuth
    ) { }

    async create(dto: CreatePhaseDto, options?: { skipValidation?: boolean }) {
        const { project, userId } = dto;
        if (!options?.skipValidation) {
            if (!userId) { return }
            const { projectDoc, isLeadPI } = await this.projectAuth.auth(project, userId, PERMISSIONS.PHASE.CREATE);

            if (isLeadPI) {
                if (
                    projectDoc.status !== ProjectStatus.draft
                ) {
                    throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
                }
            }

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
                await this.projectRepo.incrementTotals(project, {
                    duration: created.duration,
                    budget: created.budget
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
    async getPhases(filter: FilterPhases, options?: FilterOptions) {
        return await this.phaseRepo.find(filter, options);
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

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(projectId, userId, PERMISSIONS.PHASE.UPDATE);
        if (isLeadPI) {
            if (
                projectDoc.status !== ProjectStatus.draft
            ) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }
        }

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
        await this.projectRepo.incrementTotals(
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
    async transitionState(dto: TransitionRequestDto, userId: string) {
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

        const projectDoc = await this.projectRepo.findById(projectId);

        if (!projectDoc)
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        const phases = await this.phaseRepo.find({
            project: projectId
        });

        const projectStatus = projectDoc.status;

        /**
         * ---------------------------------------------------
         * DIVIDE PHASES
         * ---------------------------------------------------
         */

        const previousPhases = phases.filter(
            phase => phase.order < currentPhaseDoc.order
        );

        const nextPhases = phases.filter(
            phase => phase.order > currentPhaseDoc.order
        );

        /**
         * ---------------------------------------------------
         * PROJECT STATUS VALIDATION
         * ---------------------------------------------------
         *
         * Execution states require the project to be granted.
         */
        const executionStates = [
            PhaseStatus.active,
            PhaseStatus.completed,
            PhaseStatus.terminated,
        ];

        const involvesExecution =
            executionStates.includes(from) ||
            executionStates.includes(to);

        if (
            involvesExecution &&
            projectStatus !== ProjectStatus.granted
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_GRANTED
            );
        }

        /**
         * ---------------------------------------------------
         * PHASE EXECUTION
         * ---------------------------------------------------
         *
         * A phase can become active only when:
         *
         * 1. Every previous phase is completed.
         * 2. No later phase is active.
         * 3. No later phase is completed.
         * 4. No later phase is terminated.
         */
        if (to === PhaseStatus.active) {

            /**
             * All previous phases must be completed.
             */
            const hasIncompletePreviousPhase =
                previousPhases.some(
                    phase => phase.status !== PhaseStatus.completed
                );

            if (hasIncompletePreviousPhase) {
                throw new AppError(
                    ERROR_CODES.PREVIOUS_PHASE_NOT_COMPLETED
                );
            }

            /**
             * No later phase may already be active
             * or completed.
             */
            const hasLaterExecutedPhase = nextPhases.some(
                phase => executionStates.includes(phase.status)
            );

            if (hasLaterExecutedPhase) {
                throw new AppError(
                    ERROR_CODES.NEXT_PHASE_ALREADY_EXECUTED
                );
            }

            /**
             * APPROVED → ACTIVE
             *
             * Consume the phase budget only when the
             * phase actually starts execution.
             */
            if (
                from === PhaseStatus.approved
            ) {
                await this.grantRepo.consumeBudget(
                    projectDoc.grant.toString(),
                    currentPhaseDoc.budget
                );
            }
        }

        /**
         * ---------------------------------------------------
         * ACTIVE → APPROVED
         * ---------------------------------------------------
         *
         * Rollback consumed budget.
         */
        if (
            from === PhaseStatus.active &&
            to === PhaseStatus.approved
        ) {
            await this.grantRepo.reverseConsumedBudget(
                projectDoc.grant.toString(),
                currentPhaseDoc.budget
            );
        }

        /**
         * ---------------------------------------------------
         * UPDATE PHASE
         * ---------------------------------------------------
         */
        const updated = await this.phaseRepo.updateStatus(
            id,
            to,
            userId
        );

        if (updated) {

            /**
             * Phase became active.
             */
            if (to === PhaseStatus.active) {
                await this.projectRepo.update(
                    projectId,
                    {
                        currentPhase: id,
                    },
                    userId
                );
            }

            /**
             * Current phase is no longer active.
             */
            else if (from === PhaseStatus.active) {
                await this.projectRepo.update(
                    projectId,
                    {
                        currentPhase: null,
                    },
                    userId
                );
            }
        }

        return updated;
    }
    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto, userId: string) {
        const { id } = dto;
        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);

        const projectId = String(phaseDoc.project);
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(projectId, userId, PERMISSIONS.PHASE.DELETE);
        if (isLeadPI) {
            if (
                projectDoc.status !== ProjectStatus.draft
            ) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }
        }
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
        await this.projectRepo.incrementTotals(projectId, {
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
        PhaseStatus.approved,
        PhaseStatus.refused
    ],

    [PhaseStatus.approved]: [
        PhaseStatus.active,
        PhaseStatus.proposed
    ],

    [PhaseStatus.refused]: [
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