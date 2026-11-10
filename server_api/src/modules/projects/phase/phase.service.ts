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

type PhaseConstraintFields = Pick<PhaseValidationInput, "title" | "duration" | "budget">;

type ActivityList = Awaited<ReturnType<IPhaseActivityRepository["find"]>>;
type EquipmentList = Awaited<ReturnType<IPhaseEquipmentRepository["find"]>>;

interface PhaseChange {
    add?: PhaseConstraintFields;
    update?: { id: string; data: Partial<PhaseConstraintFields> };
    remove?: string;
}

interface ValidatePhaseChangeParams {
    projectDoc: IProject;
    projectId: string;
    change: PhaseChange;
    /** Wording used in the error message. */
    label: "proposed" | "remaining";
}

/** Phase states that mean the phase is being (or has been) executed. */
const EXECUTION_STATES: PhaseStatus[] = [
    PhaseStatus.active,
    PhaseStatus.completed,
    PhaseStatus.cancelled,
];

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
    // Constraint validation helpers
    // ---------------------------------------------------

    private toValidationInput(phase: IPhase): PhaseValidationInput {
        return {
            _id: phase._id,
            title: phase.title,
            duration: phase.duration,
            budget: phase.budget
        };
    }

    /** Returns the project's phases as they would look after applying `change`. */
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

    /** Validates the grant constraint against the phases after `change`. */
    private async validatePhaseChange(params: ValidatePhaseChangeParams): Promise<void> {
        const { projectDoc, projectId, change, label } = params;

        const grantDoc = await this.grantRepo.findById(String(projectDoc.grant));
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);

        // Nothing to validate when the grant has no constraint.
        if (!grantDoc.constraint) return;

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
                result
            );
        }
    }

    // ---------------------------------------------------
    // Totals helpers (shared by approval and completion)
    // ---------------------------------------------------

    private async loadPhaseItems(phaseId: string) {
        const [activities, equipment] = await Promise.all([
            this.activityRepo.find({ phase: phaseId }),
            this.equipmentRepo.find({ phase: phaseId }),
        ]);

        return { activities, equipment };
    }

    /** Sum of activity durations in days. Throws if any activity has bad dates. */
    /*
    private sumActivityDuration(activities: ActivityList): number {
        return activities.reduce((total, activity) => {
            if (!activity.startDate || !activity.endDate) {
                throw new AppError(ERROR_CODES.PHASE_ACTIVITY_DATES_REQUIRED);
            }

            const duration = calculateDurationDays(
                activity.startDate,
                activity.endDate
            );

            if (duration <= 0) {
                throw new AppError(ERROR_CODES.PHASE_ACTIVITY_INVALID_DATES);
            }

            return total + duration;
        }, 0);
    }

    */

    /** Sum of activity costs plus equipment (unitPrice * quantity). */
    private sumCost(activities: ActivityList, equipment: EquipmentList): number {
        const activityCost = activities.reduce(
            (total, a) => total + Number(a.cost || 0),
            0
        );

        const equipmentCost = equipment.reduce(
            (total, e) => total + Number(e.unitPrice || 0) * Number(e.quantity || 0),
            0
        );

        return activityCost + equipmentCost;
    }

    /** Activity duration and total cost must match the phase's duration and budget. */
    private assertPhaseTotals(
        phaseDoc: IPhase,
        activities: ActivityList,
        equipment: EquipmentList
    ) {

        /*
        const activityDuration = this.sumActivityDuration(activities);
        if (activityDuration !== Number(phaseDoc.duration)) {
            throw new AppError(
                ERROR_CODES.PHASE_DURATION_MISMATCH,
                `Total activity duration (${activityDuration} days) must equal the phase duration (${phaseDoc.duration} days).`
            );
        }
        */

        const totalCost = this.sumCost(activities, equipment);

        if (Math.abs(totalCost - Number(phaseDoc.budget)) > 0.01) {
            throw new AppError(
                ERROR_CODES.PHASE_BUDGET_MISMATCH,
                `Total activity and equipment cost (${totalCost.toFixed(2)}) must equal the phase budget (${Number(phaseDoc.budget).toFixed(2)}).`
            );
        }
    }

    // ---------------------------------------------------
    // Transition rules (one method per target state)
    // ---------------------------------------------------

    private async assertCanApprove(phaseDoc: IPhase) {
        const { activities, equipment } = await this.loadPhaseItems(phaseDoc._id.toString());

        if (!activities.length) {
            throw new AppError(ERROR_CODES.PHASE_APPROVAL_REQUIRES_ACTIVITY);
        }

        if (activities.some(a => a.status !== PhaseActivityStatus.approved)) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITIES_MUST_BE_APPROVED);
        }

        if (equipment.some(e => e.status !== PhaseEquipmentStatus.approved)) {
            throw new AppError(ERROR_CODES.PHASE_EQUIPMENT_MUST_BE_APPROVED);
        }

        this.assertPhaseTotals(phaseDoc, activities, equipment);
    }

    private assertCanActivate(previousPhases: IPhase[], nextPhases: IPhase[]) {
        if (previousPhases.some(p => p.status !== PhaseStatus.completed)) {
            throw new AppError(ERROR_CODES.PREVIOUS_PHASE_NOT_COMPLETED);
        }

        if (nextPhases.some(p => EXECUTION_STATES.includes(p.status))) {
            throw new AppError(ERROR_CODES.NEXT_PHASE_ALREADY_EXECUTED);
        }
    }

    private async assertCanComplete(
        phaseDoc: IPhase,
        projectId: string,
        isFinalPhase: boolean
    ) {
        const { activities, equipment } = await this.loadPhaseItems(phaseDoc._id.toString());

        if (
            !activities.length ||
            activities.some(a => a.status !== PhaseActivityStatus.completed)
        ) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITIES_NOT_COMPLETED);
        }

        if (equipment.some(e => e.status !== PhaseEquipmentStatus.delivered)) {
            throw new AppError(ERROR_CODES.PHASE_EQUIPMENT_NOT_DELIVERED);
        }

        this.assertPhaseTotals(phaseDoc, activities, equipment);

        const hasProgressReport = await this.phaseDocRepo.exists({
            phase: String(phaseDoc._id),
            type: PhaseDocumentType.progressReport,
            status: ProjectDocumentStatus.approved
        });

        if (!hasProgressReport) {
            throw new AppError(ERROR_CODES.PHASE_PROGRESS_REPORT_REQUIRED);
        }
    }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    async create(
        dto: CreatePhaseDto,
        userId: string,
        options?: { skipValidation?: boolean }
    ) {
        const { project } = dto;

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
            const lastPhase = await this.phaseRepo.findLastPhase(project);
            const order = lastPhase ? lastPhase.order + 1 : 1;

            return await this.phaseRepo.create({ ...dto, order });
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
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        if (phaseDoc.status !== PhaseStatus.proposed) {
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);
        }

        const projectId = String(phaseDoc.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE.UPDATE
        );

        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        // Budget modification is currently not supported
        if (
            data.budget !== undefined &&
            data.budget !== phaseDoc.budget
        ) {
            throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        }

        // Only re-validate when a constrained field is being changed.
        const touchesConstrainedFields =
            data.title !== undefined ||
            data.duration !== undefined;

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
                        }
                    }
                },
                label: "proposed"
            });
        }

        return await this.phaseRepo.update(id, data);
    }

    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------
    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, next, current } = dto;

        const phaseDoc = await this.phaseRepo.findById(id);
        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        const from = phaseDoc.status as PhaseStatus;
        const to = next as PhaseStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(from, to, PHASE_TRANSITIONS);

        const projectId = String(phaseDoc.project);

        const projectDoc = await this.projectRepo.findById(projectId);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        const phases = await this.phaseRepo.find({ project: projectId });
        const previousPhases = phases.filter(p => p.order < phaseDoc.order);
        const nextPhases = phases.filter(p => p.order > phaseDoc.order);

        // ---- Rules per target state ----

        if (to === PhaseStatus.approved) {
            await this.assertCanApprove(phaseDoc);
        }

        // Execution states require the project to be granted.
        const involvesExecution =
            EXECUTION_STATES.includes(from) || EXECUTION_STATES.includes(to);

        if (involvesExecution && projectDoc.status !== ProjectStatus.granted) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);
        }

        if (to === PhaseStatus.active) {
            this.assertCanActivate(previousPhases, nextPhases);

            // The budget is consumed only when execution actually starts.
            if (from === PhaseStatus.approved) {
                await this.grantRepo.consumeBudget(
                    projectDoc.grant.toString(),
                    phaseDoc.budget
                );
            }
        }

        // ACTIVE -> APPROVED rolls the consumed budget back.
        if (from === PhaseStatus.active && to === PhaseStatus.approved) {
            await this.grantRepo.reverseConsumedBudget(
                projectDoc.grant.toString(),
                phaseDoc.budget
            );
        }

        if (to === PhaseStatus.completed) {
            await this.assertCanComplete(
                phaseDoc,
                projectId,
                nextPhases.length === 0
            );
        }

        // ---- Apply ----

        const updated = await this.phaseRepo.updateStatus(id, to, userId);

        if (updated) {
            if (to === PhaseStatus.active) {
                await this.projectRepo.update(projectId, { currentPhase: id }, userId);
            } else if (from === PhaseStatus.active) {
                await this.projectRepo.update(projectId, { currentPhase: null }, userId);
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

        if (phaseDoc.status !== PhaseStatus.proposed) {
            throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);
        }

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

        await this.activityRepo.deleteByPhase(id);
        await this.equipmentRepo.deleteByPhase(id);
        const deleted = await this.phaseRepo.delete(id);

        // Re-arrange orders of remaining phases
        if (deleted) {
            await this.phaseRepo.updateMany(
                { projectId, order: { $gt: phaseDoc.order } },
                { $inc: { order: -1 } }
            );
        }

        return deleted;
    }
}

export const PHASE_TRANSITIONS: Record<PhaseStatus, PhaseStatus[]> = {
    [PhaseStatus.proposed]: [PhaseStatus.approved, PhaseStatus.refused],
    [PhaseStatus.approved]: [PhaseStatus.active, PhaseStatus.proposed],
    [PhaseStatus.refused]: [PhaseStatus.proposed],
    [PhaseStatus.active]: [
        PhaseStatus.completed,
        PhaseStatus.cancelled,
        PhaseStatus.approved
    ],
    [PhaseStatus.completed]: [PhaseStatus.active],
    [PhaseStatus.cancelled]: [PhaseStatus.active]
};