import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ConstraintValidationService, EquipmentValidationInput } from "../../constraints/ConstraintValidationService";
import { IPhaseActivityRepository } from "../activities/phase-activity.repository"; // adjust path to your folder
import { IPhase } from "../phase/phase.model";
import { IPhaseRepository } from "../phase/phase.repository";
import { PHASE_EDITABLE_STATES } from "../phase/phase.service";
import { ProjectAuth } from "../project.auth";
import { IProject } from "../project.model";
import { ProjectConsistencyValidator } from "../ProjectConsistencyValidator";
import {
    CreatePhaseEquipmentDto,
    FilterPhaseEquipments,
    UpdatePhaseEquipmentDto,
} from "./phase-equipment.dto";
import {
    IPhaseEquipment,
    PhaseEquipmentStatus,
} from "./phase-equipment.model";
import { IPhaseEquipmentRepository } from "./phase-equipment.repository";

/** Minimal shape the consistency validator needs for equipment. */
interface MyEquipmentValidationInput extends EquipmentValidationInput {
    _id?: string;
    phase?: string;
    packSize?: number;
    requiredBy?: Date | string;
}

interface EquipmentChange {
    add?: MyEquipmentValidationInput;
    update?: { id: string; data: Partial<MyEquipmentValidationInput> };
    remove?: string;
}

interface ValidateEquipmentChangeParams {
    projectDoc: IProject;
    phaseDoc: IPhase;
    change: EquipmentChange;
}

const toEquipmentValidationInput = (
    e: IPhaseEquipment
): MyEquipmentValidationInput => ({
    _id: String(e._id),
    phase: e.phase ? String(e.phase) : undefined,
    itemName: (e as any).itemName,
    quantity: Number((e as any).quantity),
    unitPrice: Number((e as any).unitPrice),
    packSize: (e as any).packSize,
    requiredBy: (e as any).requiredBy,
});

/** Drops undefined keys so a partial DTO never overwrites existing values. */
const definedOnly = <T extends object>(obj: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;

export class PhaseEquipmentService {

    constructor(
        private readonly equipmentRepo: IPhaseEquipmentRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly activityRepo: IPhaseActivityRepository,            // NEW
        private readonly constraintValidationService: ConstraintValidationService,
        private readonly consistencyValidator: ProjectConsistencyValidator, // NEW
        private readonly projectAuth: ProjectAuth
    ) { }


    // ---------------------------------------------------
    // Consistency helpers (same pattern as PhaseActivityService)
    // ---------------------------------------------------

    /** Returns the phase's equipment as it would look after applying `change`. */
    private applyEquipmentChange(
        current: IPhaseEquipment[],
        change: EquipmentChange
    ): MyEquipmentValidationInput[] {

        let items = current.map(toEquipmentValidationInput);

        if (change.remove) {
            items = items.filter(e => e._id !== change.remove);
        }

        if (change.update) {
            const { id, data } = change.update;

            items = items.map(e =>
                e._id === id ? { ...e, ...data } : e
            );
        }

        if (change.add) {
            items.push(change.add);
        }

        return items;
    }

    /**
     * Validates the proposed equipment against the parent phase:
     * - activities + equipment cost does not exceed the phase budget
     * - each requiredBy date falls within the phase dates
     * - equipment belongs to the phase
     */
    private async validateEquipmentChange(
        params: ValidateEquipmentChangeParams
    ): Promise<void> {
        const { projectDoc, phaseDoc, change } = params;

        if (!PHASE_EDITABLE_STATES.includes(phaseDoc.status)) {
            throw new AppError(ERROR_CODES.PHASE_NOT_EDITABLE);
        }

        const phaseId = String(phaseDoc._id);

        const [currentEquipment, activities] = await Promise.all([
            this.equipmentRepo.find({ phase: phaseId }),
            this.activityRepo.find({ phase: phaseId }),
        ]);

        const proposedEquipment = this.applyEquipmentChange(
            currentEquipment,
            change
        );

        const activityInputs = activities.map(a => ({
            _id: String(a._id),
            phase: a.phase ? String(a.phase) : undefined,
            cost: Number(a.cost),
            startDate: (a as any).startDate,
            endDate: (a as any).endDate,
        }));

        this.consistencyValidator.validatePhaseResourceAllocations(
            {
                _id: phaseId,
                budget: Number(phaseDoc.budget),
                startDate: (phaseDoc as any).startDate,
                endDate: (phaseDoc as any).endDate,
            },
            activityInputs,
            proposedEquipment
        );

        // Validate grant constraints.
        const constraintDoc = await this.constraintValidationService.getConstraintByGrant(
            String(projectDoc.grant)
        );

        if (!constraintDoc) return;

        const result = this.constraintValidationService.validateEquipments(
            constraintDoc,
            proposedEquipment,
            change.add ? { skipMin: true } : undefined
        );

        if (!result.valid) {
            throw new AppError(
                ERROR_CODES.INVALID_CONSTRAINT,
                'The ${label} activities do not satisfy the constraint requirements.',
                400,
                result
            );
        }
    }


    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(
        dto: CreatePhaseEquipmentDto,
        userId: string
    ) {
        const { phase } = dto;

        const phaseDoc = await this.phaseRepo.findById(phase);

        if (!phaseDoc) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                phaseDoc.project.toString(),
                userId,
                PERMISSIONS.PHASE_EQUIPMENT.CREATE
            );

        // A lead PI can add equipment only while the project is a draft.
        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        // Validate before touching the DB.
        await this.validateEquipmentChange({
            projectDoc,
            phaseDoc,
            change: {
                add: {
                    phase,
                    itemName: (dto as any).itemName,
                    quantity: (dto as any).quantity,
                    unitPrice: (dto as any).unitPrice,
                    packSize: (dto as any).packSize,
                    requiredBy: (dto as any).requiredBy,
                },
            },
        });

        try {
            return await this.equipmentRepo.create(
                {
                    ...dto,
                    phase: phase,
                    project: phaseDoc.project,
                },
                userId
            );
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(
                    ERROR_CODES.PHASE_EQUIPMENT_ALREADY_EXISTS
                );
            }

            throw err;
        }
    }


    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------

    async getEquipments(
        filter: FilterPhaseEquipments,
        options?: FilterOptions
    ) {
        return await this.equipmentRepo.find(filter, options);
    }


    // ---------------------------------------------------
    // GET BY ID
    // ---------------------------------------------------

    async getById(
        id: string,
        options?: FilterOptions
    ) {
        const equipment =
            await this.equipmentRepo.findById(id, options);

        if (!equipment) {
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );
        }

        return equipment;
    }


    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------

    async update(
        id: string,
        dto: UpdatePhaseEquipmentDto,
        userId: string
    ): Promise<IPhaseEquipment | null> {

        const equipmentDoc =
            await this.equipmentRepo.findById(id);

        if (!equipmentDoc) {
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );
        }

        // The project is immutable and determined by existing equipment.
        const projectId = equipmentDoc.project.toString();

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                projectId,
                userId,
                PERMISSIONS.PHASE_EQUIPMENT.UPDATE
            );

        // Lead PIs can update equipment only while the project is a draft.
        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        // Loaded when dto.phase is given; reused for validation below.
        let targetPhaseDoc: IPhase | null = null;

        // Validate the new phase only when provided.
        if (dto.phase !== undefined) {
            const phaseDoc = await this.phaseRepo.findById(dto.phase);

            if (!phaseDoc) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            // The phase must belong to the equipment's original project.
            if (phaseDoc.project.toString() !== projectId) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            targetPhaseDoc = phaseDoc;
        }

        // Validate the equipment against its (possibly new) phase.
        const changed = definedOnly({
            itemName: (dto as any).itemName,
            quantity: (dto as any).quantity,
            unitPrice: (dto as any).unitPrice,
            packSize: (dto as any).packSize,
            requiredBy: (dto as any).requiredBy,
        });

        const movingPhase =
            dto.phase !== undefined &&
            dto.phase !== String(equipmentDoc.phase);

        if (movingPhase || Object.keys(changed).length > 0) {

            if (!targetPhaseDoc) {
                targetPhaseDoc = await this.phaseRepo.findById(
                    String(equipmentDoc.phase)
                );
            }

            if (!targetPhaseDoc) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            const targetPhaseId = String(targetPhaseDoc._id);

            await this.validateEquipmentChange({
                projectDoc,
                phaseDoc: targetPhaseDoc,
                change: movingPhase
                    // Moving: the item is new to the target phase, with merged values.
                    // (Removing it from the old phase only lowers that phase's cost.)
                    ? {
                        add: {
                            ...toEquipmentValidationInput(equipmentDoc),
                            ...changed,
                            phase: targetPhaseId,
                        },
                    }
                    // Same phase: swap the item's values in place.
                    : { update: { id, data: changed } },
            });
        }

        return this.equipmentRepo.update(id, dto, userId);
    }


    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------

    async transitionState(
        dto: TransitionRequestDto & { reason?: string },
        userId: string
    ) {
        const { id, next, current, reason } = dto;

        const equipment =
            await this.equipmentRepo.findById(id);

        if (!equipment) {
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );
        }

        const from = equipment.status as PhaseEquipmentStatus;
        const to = next as PhaseEquipmentStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PHASE_EQUIPMENT_TRANSITIONS
        );

        const phaseDoc =
            await this.phaseRepo.findById(String(equipment.phase));

        if (!phaseDoc) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        if (!PHASE_EDITABLE_STATES.includes(phaseDoc.status)) {
            throw new AppError(ERROR_CODES.PHASE_NOT_EDITABLE);
        }

        return await this.equipmentRepo.updateStatus(
            id,
            { status: to, reason },
            userId
        );
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    // (no consistency validation: removing equipment can only lower
    //  allocated cost, so there is nothing new to validate)

    async delete(
        dto: DeleteDto,
        userId: string
    ) {
        const { id } = dto;

        const equipment =
            await this.equipmentRepo.findById(id);

        if (!equipment) {
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );
        }

        if (equipment.status !== PhaseEquipmentStatus.planned) {
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_PLANNED
            );
        }


        const phaseDoc =
            await this.phaseRepo.findById(String(equipment.phase));

        if (!phaseDoc) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        if (!PHASE_EDITABLE_STATES.includes(phaseDoc.status)) {
            throw new AppError(ERROR_CODES.PHASE_NOT_EDITABLE);
        }

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                String(phaseDoc.project),
                userId,
                PERMISSIONS.PHASE_EQUIPMENT.DELETE
            );

        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        return await this.equipmentRepo.delete(id);
    }
}


export const PHASE_EQUIPMENT_TRANSITIONS: Record<PhaseEquipmentStatus, PhaseEquipmentStatus[]> = {
    [PhaseEquipmentStatus.planned]: [
        PhaseEquipmentStatus.approved,
        PhaseEquipmentStatus.refused,
        PhaseEquipmentStatus.cancelled,
    ],

    [PhaseEquipmentStatus.approved]: [
        PhaseEquipmentStatus.delivered,
        PhaseEquipmentStatus.cancelled,
        PhaseEquipmentStatus.planned,
    ],

    [PhaseEquipmentStatus.refused]: [
        PhaseEquipmentStatus.planned,
    ],

    [PhaseEquipmentStatus.delivered]: [
        PhaseEquipmentStatus.approved,
    ],

    [PhaseEquipmentStatus.cancelled]: [
        PhaseEquipmentStatus.planned,
    ],
};