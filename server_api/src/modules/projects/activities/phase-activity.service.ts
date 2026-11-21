import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";

import { IPhaseEquipmentRepository } from "../equipments/phase-equipment.repository";
import { IPhase } from "../phase/phase.model";
import { IPhaseRepository } from "../phase/phase.repository";
import { ProjectAuth } from "../project.auth";
import { ProjectConsistencyValidator } from "../ProjectConsistencyValidator";

import { ProjectDocumentStatus } from "../phase/documents/phase.doc.model";
import { IPhaseDocumentRepository } from "../phase/documents/phase.doc.repository";
import { PHASE_EDITABLE_STATES } from "../phase/phase.service";
import { findMissingDocumentTypes, humanize } from "./phase-activity-document.mapper";
import {
    CreatePhaseActivityDto,
    FilterPhaseActivities,
    UpdatePhaseActivityDto,
} from "./phase-activity.dto";
import {
    IPhaseActivity,
    IPhaseActivityDetailCost,
    PhaseActivityStatus,
    PhaseActivityType,
} from "./phase-activity.model";
import { IPhaseActivityRepository } from "./phase-activity.repository";
import { ActivityValidationInput, ConstraintValidationService } from "../../constraints/ConstraintValidationService";
import { IProject } from "../project.model";

interface ActivityChange {
    add?: ActivityValidationInput;
    update?: { id: string; data: Partial<ActivityValidationInput> };
    remove?: string;
}

interface ValidateActivityChangeParams {
    projectDoc: IProject;
    phaseDoc: IPhase;
    change: ActivityChange;
}

const toActivityValidationInput = (a: IPhaseActivity): ActivityValidationInput => ({
    _id: String(a._id),
    phase: a.phase ? String(a.phase) : undefined,
    title: a.title,
    cost: Number(a.cost),
    startDate: (a as any).startDate,
    endDate: (a as any).endDate,
});

/** Drops undefined keys so a partial DTO never overwrites existing values. */
const definedOnly = <T extends object>(obj: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as Partial<T>;



export class PhaseActivityService {

    constructor(
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly documentRepo: IPhaseDocumentRepository,
        private readonly equipmentRepo: IPhaseEquipmentRepository,          // NEW
        private readonly constraintValidationService: ConstraintValidationService,
        private readonly consistencyValidator: ProjectConsistencyValidator, // NEW
        private readonly projectAuth: ProjectAuth
    ) { }


    /**
    * If detailCost is provided: participants * unitPrice * duration must equal cost.
    */
    private validateCost(
        cost: number,
        detailCost?: IPhaseActivityDetailCost
    ) {
        if (!detailCost) return;
        const expected =
            detailCost.participants * detailCost.unitPrice * detailCost.duration;

        // tolerance avoids floating point issues (e.g. 0.1 * 3)
        if (Math.abs(expected - cost) > 0.01) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITY_COST_MISMATCH);
        }
    }

    // ---------------------------------------------------
    // Consistency helpers (same pattern as PhaseService)
    // ---------------------------------------------------

    /** Returns the phase's activities as they would look after applying `change`. */
    private applyActivityChange(
        current: IPhaseActivity[],
        change: ActivityChange
    ): ActivityValidationInput[] {

        let activities = current.map(toActivityValidationInput);

        if (change.remove) {
            activities = activities.filter(
                a => a._id !== change.remove
            );
        }

        if (change.update) {
            const { id, data } = change.update;

            activities = activities.map(a =>
                a._id === id ? { ...a, ...data } : a
            );
        }

        if (change.add) {
            activities.push(change.add);
        }

        return activities;
    }

    /**
     * Validates the proposed activities against the parent phase:
     * - each activity's dates fall within the phase dates
     * - activities + equipment cost does not exceed the phase budget
     */
    private async validateActivityChange(
        params: ValidateActivityChangeParams
    ): Promise<void> {
        const { projectDoc, phaseDoc, change } = params;

        if (!PHASE_EDITABLE_STATES.includes(phaseDoc.status)) {
            throw new AppError(ERROR_CODES.PHASE_NOT_EDITABLE);
        }

        const phaseId = String(phaseDoc._id);

        const [currentActivities, equipment] = await Promise.all([
            this.activityRepo.find({ phase: phaseId }),
            this.equipmentRepo.find({ phase: phaseId }),
        ]);

        const proposedActivities = this.applyActivityChange(
            currentActivities,
            change
        );

        this.consistencyValidator.validatePhaseResourceAllocations(
            {
                _id: phaseId,
                budget: Number(phaseDoc.budget),
                startDate: (phaseDoc as any).startDate,
                endDate: (phaseDoc as any).endDate,
            },
            proposedActivities,
            equipment
        );


        // Validate grant constraints.
        const constraintDoc = await this.constraintValidationService.getConstraintByGrant(
            String(projectDoc.grant)
        );

        if (!constraintDoc) return;

        const result = this.constraintValidationService.validateActivities(
            constraintDoc,
            proposedActivities,
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
        dto: CreatePhaseActivityDto,
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
                PERMISSIONS.PHASE_ACTIVITY.CREATE
            );

        // A lead PI can add activities only while the project is a draft.
        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        // Validate before touching the DB.
        this.validateCost(dto.cost, dto.detailCost);

        await this.validateActivityChange({
            projectDoc,
            phaseDoc,
            change: {
                add: {
                    phase,
                    title: dto.title,
                    cost: dto.cost,
                    startDate: (dto as any).startDate,
                    endDate: (dto as any).endDate,
                },
            },
        });

        try {
            return await this.activityRepo.create({
                ...dto,
                phase: phase,
                project: phaseDoc.project.toString()
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(
                    ERROR_CODES.PHASE_ACTIVITY_ALREADY_EXISTS
                );
            }

            throw err;
        }
    }


    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------

    async getActivities(
        filter: FilterPhaseActivities,
        options?: FilterOptions
    ) {
        return await this.activityRepo.find(filter, options);
    }


    // ---------------------------------------------------
    // GET BY ID
    // ---------------------------------------------------

    async getById(
        id: string,
        options?: FilterOptions
    ) {
        const activity =
            await this.activityRepo.findById(id, options);

        if (!activity) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND);
        }

        return activity;
    }


    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(
        id: string,
        dto: UpdatePhaseActivityDto,
        userId: string
    ): Promise<IPhaseActivity | null> {

        const activityDoc = await this.activityRepo.findById(id);

        if (!activityDoc) {
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );
        }

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                activityDoc.project.toString(),
                userId,
                PERMISSIONS.PHASE_ACTIVITY.UPDATE
            );

        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        // Detect activity kind changes.
        const kindChanged =
            dto.kind !== undefined &&
            dto.kind !== activityDoc.kind;

        // Require new details when changing activity kind.
        if (kindChanged && dto.details == null) {
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_DETAILS_REQUIRED
            );
        }

        // Validate cost using effective values.
        if (
            dto.cost !== undefined ||
            dto.detailCost !== undefined
        ) {
            const effectiveCost =
                dto.cost ?? activityDoc.cost;

            const effectiveDetailCost =
                dto.detailCost ?? activityDoc.detailCost;

            this.validateCost(
                effectiveCost,
                effectiveDetailCost ?? undefined
            );
        }

        // Validate the activity against its phase (budget + dates).
        // Phase is optional: only check it when the activity has one.
        const changed = definedOnly({
            cost: dto.cost,
            startDate: (dto as any).startDate,
            endDate: (dto as any).endDate,
        });

        if (activityDoc.phase && Object.keys(changed).length > 0) {
            const phaseDoc =
                await this.phaseRepo.findById(String(activityDoc.phase));

            if (!phaseDoc) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            await this.validateActivityChange({
                projectDoc,
                phaseDoc,
                change: { update: { id, data: changed } },
            });
        }

        return this.activityRepo.update(
            id,
            dto,
            userId
        );
    }


    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------
    // (unchanged)

    async transitionState(
        dto: TransitionRequestDto,
        userId: string
    ) {
        const { id, next, current, reason } = dto;

        const activityDoc =
            await this.activityRepo.findById(id);

        if (!activityDoc) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND);
        }

        const from = activityDoc.status as PhaseActivityStatus;
        const to = next as PhaseActivityStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PHASE_ACTIVITY_TRANSITIONS
        );

        if (!activityDoc.phase) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        const phaseDoc =
            await this.phaseRepo.findById(String(activityDoc.phase));

        if (!phaseDoc) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        if (!PHASE_EDITABLE_STATES.includes(phaseDoc.status)) {
            throw new AppError(ERROR_CODES.PHASE_NOT_EDITABLE);
        }

        // Completion requires the documents that prove the activity kind.
        if (to === PhaseActivityStatus.completed) {

            if (!activityDoc.kind) {
                throw new AppError(ERROR_CODES.PHASE_ACTIVITY_DETAILS_REQUIRED);
            }

            const approvedDocuments = await this.documentRepo.find({
                activity: id,
                status: ProjectDocumentStatus.approved,
            });

            const missing = findMissingDocumentTypes(
                activityDoc.kind as PhaseActivityType,
                approvedDocuments
            );

            if (missing) {
                const accepted = missing.map(humanize).join(" or ");

                throw new AppError(
                    ERROR_CODES.PHASE_ACTIVITY_DOCUMENTS_REQUIRED,
                    `This ${humanize(activityDoc.kind)} activity cannot be completed yet. ` +
                    `Upload and get approval for at least one of the following documents: ${accepted}.`
                );
            }
        }

        return await this.activityRepo.updateStatus(id, { status: to, reason }, userId);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    // (unchanged: removing an activity can only lower allocated cost,
    //  so there is nothing new to validate)

    async delete(
        dto: DeleteDto,
        userId: string
    ) {
        const { id } = dto;

        const activity =
            await this.activityRepo.findById(id);

        if (!activity) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND);
        }

        const phaseDoc =
            await this.phaseRepo.findById(String(activity.phase));

        if (!phaseDoc) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        if (!PHASE_EDITABLE_STATES.includes(phaseDoc.status)) {
            throw new AppError(ERROR_CODES.PHASE_NOT_EDITABLE);
        }

        // Authorize directly against the activity's project
        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                String(activity.project),
                userId,
                PERMISSIONS.PHASE_ACTIVITY.DELETE
            );

        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        return await this.activityRepo.delete(id);
    }
}


export const PHASE_ACTIVITY_TRANSITIONS: Record<PhaseActivityStatus, PhaseActivityStatus[]> = {
    [PhaseActivityStatus.planned]: [
        PhaseActivityStatus.approved,
        PhaseActivityStatus.refused
    ],
    [PhaseActivityStatus.approved]: [
        PhaseActivityStatus.active,
        PhaseActivityStatus.planned
    ],
    [PhaseActivityStatus.refused]: [
        PhaseActivityStatus.planned
    ],
    [PhaseActivityStatus.active]: [
        PhaseActivityStatus.completed,
        PhaseActivityStatus.cancelled,
        PhaseActivityStatus.approved
    ],
    [PhaseActivityStatus.completed]: [
        PhaseActivityStatus.active
    ],
    [PhaseActivityStatus.cancelled]: [
        PhaseActivityStatus.active
    ]
};