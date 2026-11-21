import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { toObjectId } from "../../../common/utils/mongoose.utils";
import { ConstraintValidationService, PhaseValidationInput } from "../../constraints/ConstraintValidationService";
import { IGrantRepository } from "../../grants/grant.repository";
import { IPhaseActivity, PhaseActivityStatus } from "../activities/phase-activity.model";
import { IPhaseActivityRepository } from "../activities/phase-activity.repository";
import { IPhaseEquipment, PhaseEquipmentStatus } from "../equipments/phase-equipment.model";
import { IPhaseEquipmentRepository } from "../equipments/phase-equipment.repository";
import { ProjectAuth } from "../project.auth";
import { IProject, ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { PROJECT_EDITABLE_STATES } from "../project.service";
import { ProjectConsistencyValidator } from "../ProjectConsistencyValidator";
import { PhaseDocumentType, ProjectDocumentStatus } from "./documents/phase.doc.model";
import { IPhaseDocumentRepository } from "./documents/phase.doc.repository";
import { CreatePhaseDto, FilterPhases, UpdatePhaseDto } from "./phase.dto";
import { IPhase, PhaseStatus } from "./phase.model";
import { IPhaseRepository } from "./phase.repository";


interface PhaseChange {
    add?: PhaseValidationInput;
    update?: { id: string; data: Partial<PhaseValidationInput> };
    remove?: string;
}

interface ValidatePhaseChangeParams {
    projectDoc: IProject;
    projectId: string;
    change: PhaseChange;
    /** Wording used in the error message. */
    label: "proposed" | "remaining";
}

export function toPhaseValidationInput(
    item: IPhase
): PhaseValidationInput {
    return {
        ...(item._id && { _id: item._id }),
        // order: item.order,
        budget: item.budget,
        startDate: item.startDate,
        endDate: item.endDate
    };
}

export function toPhaseValidationInputs(
    items: IPhase[]
): PhaseValidationInput[] {
    return items.map(toPhaseValidationInput);
}


export const PHASE_EDITABLE_STATES: PhaseStatus[] = [
    PhaseStatus.proposed,
    PhaseStatus.active,
];


export class PhaseService {

    constructor(
        private readonly phaseRepo: IPhaseRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly phaseDocRepo: IPhaseDocumentRepository,
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly equipmentRepo: IPhaseEquipmentRepository,
        private readonly constraintValidationService: ConstraintValidationService,
        private readonly consistencyValidator: ProjectConsistencyValidator,
        private readonly projectAuth: ProjectAuth
    ) { }

    private async loadPhaseItems(phaseId: string) {
        const [activities, equipment] = await Promise.all([
            this.activityRepo.find({ phase: phaseId }),
            this.equipmentRepo.find({ phase: phaseId }),
        ]);

        return { activities, equipment };
    }


    /** Returns the project's phases as they would look after applying `change`. */
    private applyPhaseChange(
        current: IPhase[],
        change: PhaseChange
    ): PhaseValidationInput[] {

        let phases = [...current]
            .sort((a, b) => a.order - b.order)
            .map(toPhaseValidationInput);

        if (change.remove) {
            phases = phases.filter(
                phase => String(phase._id) !== change.remove
            );
        }

        if (change.update) {
            const { id, data } = change.update;

            phases = phases.map(phase =>
                String(phase._id) === id
                    ? { ...phase, ...data }
                    : phase
            );
        }

        if (change.add) {
            phases.push(change.add);
        }

        return phases;
    }


    /** Validates grant constraints and project budget against the proposed phases. */
    private async validatePhaseChange(
        params: ValidatePhaseChangeParams
    ): Promise<void> {
        const { projectDoc, projectId, change, label } = params;

        if (!PROJECT_EDITABLE_STATES.includes(projectDoc.status)) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_EDITABLE);
        }

        const currentPhases = await this.phaseRepo.find({
            project: projectId
        });

        const proposedPhases = this.applyPhaseChange(
            currentPhases,
            change
        );

        // 1. Identify the phase being added or updated.
        const targetPhase = change.add
            ? proposedPhases[proposedPhases.length - 1]
            : change.update
                ? proposedPhases.find(
                    phase => String(phase._id) === change.update!.id
                )
                : undefined;

        if (targetPhase) {
            const otherPhases = proposedPhases.filter(
                phase => String(phase._id) !== String(targetPhase._id)
            );

            // 2. Validate phase dates against other phases.

            this.consistencyValidator.validatePhaseDates(
                targetPhase,
                otherPhases
            );

            // 3. Validate existing activities against the proposed phase.
            if (change.update && targetPhase._id) {
                const { activities, equipment } = await this.loadPhaseItems(targetPhase._id?.toString());

                this.consistencyValidator.validatePhaseResourceAllocations(
                    targetPhase,
                    activities,
                    equipment
                );
            }
        }

        // 4. Validate project budget.
        this.consistencyValidator.validatePhaseAllocations(
            projectDoc,
            proposedPhases
        );

        // 5. Validate grant constraints.
        const grantDoc = await this.grantRepo.findById(
            String(projectDoc.grant)
        );

        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        if (!grantDoc.constraint) return;

        const constraintDoc = await this.constraintValidationService.getConstraint(
            String(grantDoc.constraint)
        );

        const result = this.constraintValidationService.validatePhases(
            constraintDoc,
            proposedPhases,
            change.add ? { skipMin: true } : undefined
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
    /* Activity total cost and equipments cost must match the phase budget. */
    // ---------------------------------------------------

    private assertPhaseBudget(
        phaseDoc: IPhase,
        activities: IPhaseActivity[],
        equipments: IPhaseEquipment[]
    ) {

        const activitiesCost = this.consistencyValidator.getAllocatedActivityCost(activities);

        const equipmentsCost = this.consistencyValidator.getAllocatedEquipmentCost(equipments);

        const totalCost = activitiesCost + equipmentsCost;

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
        if (activities.some(a => a.status !== PhaseActivityStatus.approved)) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITIES_MUST_BE_APPROVED);
        }

        if (equipment.some(e => e.status !== PhaseEquipmentStatus.approved)) {
            throw new AppError(ERROR_CODES.PHASE_EQUIPMENT_MUST_BE_APPROVED);
        }

        this.assertPhaseBudget(phaseDoc, activities, equipment);
    }

    private async assertCanActivate(projectDoc: IProject, phaseDoc: IPhase) {
        if (projectDoc.status !== ProjectStatus.granted) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_GRANTED);
        }

        const phases = await this.phaseRepo.find({
            project: projectDoc._id.toString()
        });

        // Ensure all previous phases are completed
        const previousPhases = phases.filter(p => p.order < phaseDoc.order);

        if (previousPhases.some(p => p.status !== PhaseStatus.completed)) {
            throw new AppError(ERROR_CODES.PREVIOUS_PHASE_NOT_COMPLETED);
        }

        // Ensure no other phase is currently active
        const anotherActivePhase = phases.some(
            p => p._id.toString() !== phaseDoc._id.toString() &&
                p.status === PhaseStatus.active
        );

        if (anotherActivePhase) {
            throw new AppError(ERROR_CODES.ANOTHER_PHASE_ALREADY_ACTIVE);
        }
    }

    private async assertCanComplete(
        phaseDoc: IPhase
    ) {
        const { activities, equipment } = await this.loadPhaseItems(phaseDoc._id.toString());
        if (
            activities.some(a => a.status !== PhaseActivityStatus.completed)
        ) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITIES_NOT_COMPLETED);
        }

        if (equipment.some(e => e.status !== PhaseEquipmentStatus.delivered)) {
            throw new AppError(ERROR_CODES.PHASE_EQUIPMENT_NOT_DELIVERED);
        }

        this.assertPhaseBudget(phaseDoc, activities, equipment);

        const hasProgressReport = await this.phaseDocRepo.exists({
            phase: String(phaseDoc._id),
            type: PhaseDocumentType.progressReport,
            status: ProjectDocumentStatus.approved
        });

        if (!hasProgressReport) {
            throw new AppError(ERROR_CODES.PHASE_PROGRESS_REPORT_REQUIRED, "Approved Phase Progress Report Document Required");
        }
    }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    async create(
        dto: CreatePhaseDto,
        userId: string
    ) {
        try {
            const { project } = dto;
            const lastPhase = await this.phaseRepo.findLastPhase(project);
            const order = lastPhase ? lastPhase.order + 1 : 1;

            const { projectDoc, isLeadPI } = await this.projectAuth.auth(
                project,
                userId,
                PERMISSIONS.PHASE.CREATE
            );

            if (isLeadPI) {
                await this.projectAuth.validateOwner(projectDoc);
            }

            await this.validatePhaseChange({
                projectDoc,
                projectId: project,
                change: {
                    add: {
                        order,
                        //duration: dto.duration,
                        budget: dto.budget,
                        startDate: dto.startDate,
                        endDate: dto.endDate
                    }
                },
                label: "proposed",
            }
            );

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
    async update(id: string, dto: UpdatePhaseDto, userId: string) {

        const phaseDoc = await this.phaseRepo.findById(id);

        if (!phaseDoc) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        if (!PHASE_EDITABLE_STATES.includes(phaseDoc.status)) {
            throw new AppError(ERROR_CODES.INVALID_PHASE_STATUS);
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

        await this.validatePhaseChange({
            projectDoc,
            projectId,
            change: {
                update: {
                    id,
                    data: {
                        order: phaseDoc.order,
                        //duration: dto.duration,
                        budget: dto.budget
                    }
                }
            },
            label: "proposed"
        });

        return await this.phaseRepo.update(id, dto, userId);
    }

    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------
    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, next, current, reason } = dto;

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

        if (!PROJECT_EDITABLE_STATES.includes(projectDoc.status)) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_EDITABLE);
        }

        // ---- Rules per target state ----
        if (to === PhaseStatus.approved) {
            await this.assertCanApprove(phaseDoc);
        }

        if (to === PhaseStatus.active) {
            await this.assertCanActivate(projectDoc, phaseDoc)
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
                phaseDoc
            );
        }

        // ---- Apply ----

        const updated = await this.phaseRepo.update(id, {
            status: to,
            statusHistory: {
                status: to,
                changedBy: toObjectId(userId),
                reason,
                changedAt: new Date(),
            },
        }, userId);

        /*
        if (updated) {
            if (to === PhaseStatus.active) {
                await this.projectRepo.update(projectId, { currentPhase: id }, userId);
            } else if (from === PhaseStatus.active) {
                await this.projectRepo.update(projectId, { currentPhase: null }, userId);
            }
        }
        */

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

        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
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