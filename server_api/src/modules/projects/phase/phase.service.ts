import { PERMISSIONS } from "../../../common/constants/permissions";
import { SYSTEM } from "../../../common/constants/system.constant";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { calculateDurationDays } from "../../../common/utils/date.utils";
import { IGrantRepository } from "../../grants/grant.repository";
// NOTE: adjust the import path of PhaseValidationInput if it lives elsewhere.
import {
    ConstraintValidationService,
    PhaseValidationInput
} from "../../constraints/services/constraint-validator.service";
import { ProjectAuth } from "../project.auth";
import { IProject, ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { PhaseActivityStatus } from "../activities/phase-activity.model";
import { IPhaseActivityRepository } from "../activities/phase-activity.repository";
import { PhaseDocumentType, ProjectDocumentStatus } from "./documents/phase.doc.model";
import { IPhaseDocumentRepository } from "./documents/phase.doc.repository";
import { CreatePhaseDto, FilterPhases, UpdatePhaseDto } from "./phase.dto";
import { IPhase, PhaseStatus } from "./phase.model";
import { IPhaseRepository } from "./phase.repository";
import { IPhaseEquipmentRepository } from "../equipments/phase-equipment.repository";
import { PhaseEquipmentStatus } from "../equipments/phase-equipment.model";

/**
 * Fields of a phase that the constraint validator cares about.
 */
type PhaseConstraintFields = Pick<PhaseValidationInput, "title" | "duration" | "budget">;

/**
 * Describes how the project's phase list changes:
 *  - create: { add }
 *  - update: { update: { id, data } }
 *  - delete: { remove: id }
 */
interface PhaseChange {
    add?: PhaseConstraintFields;
    update?: { id: string; data: Partial<PhaseConstraintFields> };
    remove?: string;
}

interface ValidatePhaseChangeParams {
    projectDoc: IProject;
    projectId: string;
    change: PhaseChange;
    /** Wording used in the error message, e.g. "proposed" or "remaining". */
    label: "proposed" | "remaining";
}

export class PhaseService {

    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly constraintValidator: ConstraintValidationService,
        private readonly phaseDocRepo: IPhaseDocumentRepository,
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly equipmentRepo: IPhaseEquipmentRepository,
        private readonly projectAuth: ProjectAuth
    ) { }

    // ---------------------------------------------------
    // Shared validation helpers
    // ---------------------------------------------------

    private toValidationInput(phase: IPhase): PhaseValidationInput {
        return {
            _id: phase._id,
            title: phase.title,
            duration: phase.duration,
            budget: phase.budget
        };
    }

    /**
     * Returns the project's phases as they would look after applying `change`.
     */
    private applyPhaseChange(
        current: IPhase[],
        change: PhaseChange
    ): PhaseValidationInput[] {
        let phases = [...current]
            .sort((a, b) => a.order - b.order)
            .map(phase => this.toValidationInput(phase));

        if (change.remove !== undefined) {
            phases = phases.filter(p => String(p._id) !== change.remove);
        }

        if (change.update) {
            const { id, data } = change.update;
            phases = phases.map(p =>
                String(p._id) === id
                    ? {
                        ...p,
                        title: data.title ?? p.title,
                        duration: data.duration ?? p.duration,
                        budget: data.budget ?? p.budget
                    }
                    : p
            );
        }

        if (change.add) {
            phases.push({ ...change.add });
        }

        return phases;
    }

    /**
     * Validates the grant constraint against the project's phases after
     * applying `change`. Used by create, update and delete.
     */
    private async validatePhaseChange(params: ValidatePhaseChangeParams): Promise<void> {
        const { projectDoc, projectId, change, label } = params;

        const grantDoc = await this.grantRepo.findById(String(projectDoc.grant));
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        // Nothing to validate when the grant has no constraint.
        if (!grantDoc.constraint) {
            return;
        }

        const constraintDoc = await this.constraintValidator.getConstraint(
            String(grantDoc.constraint)
        );

        const currentPhases = await this.phaseRepo.find({ project: projectId });
        const proposedPhases = this.applyPhaseChange(currentPhases, change);

        const result = this.constraintValidator.validatePhases(
            constraintDoc,
            proposedPhases
        );

        if (!result.valid) {
            throw new AppError(
                ERROR_CODES.INVALID_CONSTRAINT,
                `The ${label} phases do not satisfy the constraint requirements.`,
                400,
                result.errors
            );
        }
    }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    async create(
        dto: CreatePhaseDto, userId: string,
        options?: { skipValidation?: boolean }
    ) {
        const { project } = dto;

        // --------------------------------------------------
        // Authorization / validation
        // --------------------------------------------------

        if (!options?.skipValidation && userId !== SYSTEM.SU_USER) {

            const { projectDoc, isLeadPI } = await this.projectAuth.auth(
                project,
                userId,
                PERMISSIONS.PHASE.CREATE
            );

            if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }

            await this.validatePhaseChange({
                projectDoc,
                projectId: project,
                change: {
                    add: {
                        title: dto.title,
                        duration: dto.duration,
                        budget: dto.budget
                    }
                },
                label: "proposed"
            });
        }

        try {
            // --------------------------------------------------
            // Determine order
            // --------------------------------------------------

            const lastPhase = await this.phaseRepo.findLastPhase(project);

            const order = lastPhase
                ? lastPhase.order + 1
                : 1;

            // --------------------------------------------------
            // Create phase
            // --------------------------------------------------

            const created = await this.phaseRepo.create({
                ...dto,
                order
            });

            if (!created) {
                return;
            }

            // --------------------------------------------------
            // Create activities
            // --------------------------------------------------
            /*
                        if (activities?.length) {
                            await Promise.all(
                                activities.map(activity =>
                                    this.activityRepo.create({
                                        kind: PhaseActivityType.OTHER,
                                        ...activity,
                                        phase: String(created._id),
                                        project,
                                        details: {}
                                    })
                                )
                            );
                        }
            */

            // --------------------------------------------------
            // Create equipments
            // --------------------------------------------------

            /*
            if (equipments?.length) {
                await Promise.all(
                    equipments.map(equipment =>
                        this.equipmentRepo.create({
                            ...equipment,
                            phase: String(created._id),
                            project
                        })
                    )
                );
            }
*/
            // --------------------------------------------------
            // Update project totals
            // --------------------------------------------------

            /*
            await this.projectRepo.incrementTotals(project, {
                duration: created.duration,
                budget: created.budget
            });*/

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

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE.UPDATE
        );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        // Only re-validate when a constrained field is being changed.
        const touchesConstrainedFields =
            data.title !== undefined ||
            data.duration !== undefined ||
            data.budget !== undefined;

        if (touchesConstrainedFields) {
            await this.validatePhaseChange({
                projectDoc,
                projectId,
                change: {
                    update: {
                        id,
                        data: {
                            title: data.title,
                            duration: data.duration,
                            budget: data.budget
                        }
                    }
                },
                label: "proposed"
            });
        }

        const updated = await this.phaseRepo.update(id, data);

        /*
        const oldDuration = phaseDoc.duration ?? 0;
        const oldBudget = phaseDoc.budget ?? 0;
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
*/
        return updated;
    }

    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------
    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, next, current, reason } = dto;

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
            // 2. All activities must be approved //should be proposed or refused
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
                            ERROR_CODES.PHASE_ACTIVITY_INVALID_DATES,
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
                    ERROR_CODES.PHASE_DURATION_MISMATCH,
                    `Total activity duration (${activityDuration} days) must equal the phase duration (${phaseDoc.duration} days).`
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
                    ERROR_CODES.PHASE_BUDGET_MISMATCH,
                    `Total activity and equipment cost (${totalCost.toFixed(2)}) must equal the phase budget (${Number(phaseDoc.budget).toFixed(2)}).`
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
            // Load activities and equipment
            // -----------------------------------------
            const [activities, equipment] = await Promise.all([
                this.activityRepo.find({
                    phase: phaseDoc._id,
                }),
                this.equipmentRepo.find({
                    phase: phaseDoc._id,
                }),
            ]);

            // -----------------------------------------
            // 1. All activities must be completed
            // -----------------------------------------
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
            // 2. Validate activity duration
            // -----------------------------------------
            const activityDuration = activities.reduce(
                (total, activity) => {

                    if (!activity.startDate || !activity.endDate) {
                        throw new AppError(
                            ERROR_CODES.PHASE_ACTIVITY_DATES_REQUIRED
                        );
                    }

                    const calculatedDuration =
                        calculateDurationDays(
                            activity.startDate,
                            activity.endDate
                        );

                    if (calculatedDuration <= 0) {
                        throw new AppError(
                            ERROR_CODES.PHASE_ACTIVITY_INVALID_DATES
                        );
                    }

                    return total + calculatedDuration;
                },
                0
            );

            // -----------------------------------------
            // 3. Actual activity duration must equal
            //    approved phase duration
            // -----------------------------------------
            if (
                activityDuration !==
                Number(phaseDoc.duration)
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_DURATION_MISMATCH
                );
            }

            // -----------------------------------------
            // 4. Equipment must be delivered
            // -----------------------------------------
            const undeliveredEquipment = equipment.find(
                item =>
                    item.status !== PhaseEquipmentStatus.delivered
            );

            if (undeliveredEquipment) {
                throw new AppError(
                    ERROR_CODES.PHASE_EQUIPMENT_NOT_DELIVERED
                );
            }

            // -----------------------------------------
            // 5. Calculate activity cost
            // -----------------------------------------
            const activityCost = activities.reduce(
                (total, activity) =>
                    total + Number(activity.cost || 0),
                0
            );

            // -----------------------------------------
            // 6. Calculate equipment cost
            // -----------------------------------------
            const equipmentCost = equipment.reduce(
                (total, item) =>
                    total +
                    Number(item.unitPrice || 0) *
                    Number(item.quantity || 0),
                0
            );

            // -----------------------------------------
            // 7. Actual total cost must equal
            //    approved phase budget
            // -----------------------------------------
            const totalCost =
                activityCost +
                equipmentCost;

            if (
                Math.abs(
                    totalCost -
                    Number(phaseDoc.budget)
                ) > 0.01
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_BUDGET_MISMATCH
                );
            }

            // -----------------------------------------
            // 8. Progress report is required
            // -----------------------------------------
            const hasProgressReport =
                await this.phaseDocRepo.exists({
                    phase: String(phaseDoc._id),
                    type: PhaseDocumentType.progressReport,
                    status: ProjectDocumentStatus.approved
                });

            if (!hasProgressReport) {
                throw new AppError(
                    ERROR_CODES.PHASE_PROGRESS_REPORT_REQUIRED
                );
            }

            // -----------------------------------------
            // 9. Completion report required for
            //    the final phase
            // -----------------------------------------
            if (nextPhases.length === 0) {

                const hasCompletionReport =
                    await this.phaseDocRepo.exists({
                        project: projectId,
                        type: PhaseDocumentType.completionReport,
                        status: ProjectDocumentStatus.approved
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
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE.DELETE
        );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        // Validate the remaining phases BEFORE deleting anything.
        await this.validatePhaseChange({
            projectDoc,
            projectId,
            change: { remove: id },
            label: "remaining"
        });

        // ✅ Decrement totals BEFORE delete
        /*
        await this.projectRepo.incrementTotals(projectId, {
            duration: -(phaseDoc.duration ?? 0),
            budget: -(phaseDoc.budget ?? 0)
        });
        */
        await this.activityRepo.deleteByPhase(id);
        await this.equipmentRepo.deleteByPhase(id);
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