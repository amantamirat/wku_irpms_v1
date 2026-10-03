import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { calculateDurationDays } from "../../../common/utils/date.utils";
import { IGrantRepository } from "../../grants/grant.repository";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { PhaseActivityStatus } from "./activities/phase-activity.model";
import { IPhaseActivityRepository } from "./activities/phase-activity.repository";
import { PhaseDocumentType } from "./documents/phase.doc.model";
import { IPhaseDocumentRepository } from "./documents/phase.doc.repository";
import { PhaseEquipmentStatus } from "./equipments/phase-equipment.model";
import { IPhaseEquipmentRepository } from "./equipments/phase-equipment.repository";
import { CreatePhaseDto, FilterPhases, UpdatePhaseDto } from "./phase.dto";
import { PhaseStatus } from "./phase.model";
import { IPhaseRepository } from "./phase.repository";

export class PhaseService {

    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly phaseDocRepo: IPhaseDocumentRepository,
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly equipmentRepo: IPhaseEquipmentRepository,
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

        const phaseDoc = await this.phaseRepo.findById(id);

        if (!phaseDoc)
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const from = phaseDoc.status as PhaseStatus;
        const to = next as PhaseStatus;

        if (current && current !== from)
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);

        TransitionHelper.validateTransition(
            from,
            to,
            PHASE_TRANSITIONS
        );

        const projectId = String(phaseDoc.project);

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
            phase => phase.order < phaseDoc.order
        );

        const nextPhases = phases.filter(
            phase => phase.order > phaseDoc.order
        );

        if (to === PhaseStatus.proposed) {
            /*
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }*/
        }

        if (to === PhaseStatus.approved) {

            const [activities, equipment] = await Promise.all([
                this.activityRepo.find({
                    phase: phaseDoc._id
                }),
                this.equipmentRepo.find({
                    phase: phaseDoc._id
                })
            ]);

            // -----------------------------------------
            // 1. At least one activity is required
            // -----------------------------------------
            if (!activities.length) {
                throw new AppError(
                    ERROR_CODES.PHASE_APPROVAL_REQUIRES_ACTIVITY
                );
            }

            // -----------------------------------------
            // 2. All activities must be approved
            // -----------------------------------------
            const unapprovedActivity = activities.find(
                activity =>
                    activity.status !== PhaseActivityStatus.approved
            );

            if (unapprovedActivity) {
                throw new AppError(
                    ERROR_CODES.PHASE_ACTIVITIES_MUST_BE_APPROVED
                );
            }

            // -----------------------------------------
            // 3 Calculate total activity duration
            // -----------------------------------------            

            const activityDuration = activities.reduce(
                (total, activity) => {

                    if (!activity.startDate || !activity.endDate) {
                        throw new AppError(
                            ERROR_CODES.PHASE_ACTIVITY_DATES_REQUIRED
                        );
                    }


                    const duration =
                        calculateDurationDays(
                            activity.startDate,
                            activity.endDate
                        );

                    if (duration <= 0) {
                        throw new AppError(
                            ERROR_CODES.PHASE_ACTIVITY_INVALID_DATES
                        );
                    }

                    return total + duration;
                },
                0
            );

            // -----------------------------------------
            // 4. Activity duration must equal phase duration
            // -----------------------------------------
            if (activityDuration !== Number(phaseDoc.duration)) {
                throw new AppError(
                    ERROR_CODES.PHASE_DURATION_MISMATCH
                );
            }

            // -----------------------------------------
            // 5. All equipment must be approved
            // -----------------------------------------
            const unapprovedEquipment = equipment.find(
                item =>
                    item.status !== PhaseEquipmentStatus.approved
            );

            if (unapprovedEquipment) {
                throw new AppError(
                    ERROR_CODES.PHASE_EQUIPMENT_MUST_BE_APPROVED
                );
            }

            // -----------------------------------------
            // 6. Calculate activity cost
            // -----------------------------------------
            const activityCost = activities.reduce(
                (total, activity) =>
                    total + Number(activity.cost || 0),
                0
            );

            // -----------------------------------------
            // 7. Calculate equipment cost
            // -----------------------------------------
            const equipmentCost = equipment.reduce(
                (total, item) =>
                    total +
                    Number(item.unitPrice || 0) *
                    Number(item.quantity || 0),
                0
            );

            // -----------------------------------------
            // 8. Total cost must equal phase budget
            // -----------------------------------------
            const totalCost = activityCost + equipmentCost;

            if (
                Math.abs(
                    totalCost - Number(phaseDoc.budget)
                ) > 0.01
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_BUDGET_MISMATCH
                );
            }
        }

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
            PhaseStatus.cancelled,
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
                    phaseDoc.budget
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
                phaseDoc.budget
            );
        }

        if (to === PhaseStatus.completed) {

            // -----------------------------------------
            // 1. All activities must be completed
            // -----------------------------------------
            const activities = await this.activityRepo.find({
                phase: phaseDoc._id,
            });

            if (
                activities.length === 0 ||
                activities.some(
                    activity =>
                        activity.status !== PhaseActivityStatus.completed
                )
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_ACTIVITIES_NOT_COMPLETED
                );
            }

            // -----------------------------------------
            // 2. If equipment exists, all must be delivered
            // -----------------------------------------
            const equipment = await this.equipmentRepo.find({
                phase: phaseDoc._id,
            });

            const undeliveredEquipment = equipment.find(
                item => item.status !== PhaseEquipmentStatus.delivered
            );

            if (undeliveredEquipment) {
                throw new AppError(
                    ERROR_CODES.PHASE_EQUIPMENT_NOT_DELIVERED
                );
            }

            // -----------------------------------------
            // 3. Progress report is required
            // -----------------------------------------
            const hasProgressReport = await this.phaseDocRepo.exists({
                phase: String(phaseDoc._id),
                type: PhaseDocumentType.progressReport,
            });

            if (!hasProgressReport) {
                throw new AppError(
                    ERROR_CODES.PHASE_PROGRESS_REPORT_REQUIRED
                );
            }

            if (nextPhases.length === 0) {
                const hasCompletionReport = await this.phaseDocRepo.exists({
                    phase: String(phaseDoc._id),
                    type: PhaseDocumentType.completionReport,
                });

                if (!hasCompletionReport) {
                    throw new AppError(
                        ERROR_CODES.COMPLETION_REPORT_REQUIRED
                    );
                }
            }
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

        // ✅ Decrement totals BEFORE delete
        await this.projectRepo.incrementTotals(projectId, {
            duration: -(phaseDoc.duration ?? 0),
            budget: -(phaseDoc.budget ?? 0)
        });
        await this.activityRepo.deleteByPhase(id);
        await this.equipmentRepo.deleteByPhase(id)
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
        PhaseStatus.cancelled,
        PhaseStatus.approved
    ],

    [PhaseStatus.completed]: [
        PhaseStatus.active
    ],

    [PhaseStatus.cancelled]: [
        PhaseStatus.active
    ]
};