import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";

import { ProjectAuth } from "../project.auth";
import { IPhaseRepository } from "../phase/phase.repository";
import { PhaseStatus } from "../phase/phase.model";

import {
    CreatePhaseActivityDto,
    FilterPhaseActivities,
    UpdatePhaseActivityDto,
} from "./phase-activity.dto";
import { IPhaseActivityRepository } from "./phase-activity.repository";
import {
    IPhaseActivityDetailCost,
    PhaseActivityStatus,
    PhaseActivityType,
} from "./phase-activity.model";
import { findMissingDocumentTypes, humanize } from "./phase-activity-document.mapper";
import { ProjectStatus } from "../project.model";
import { IPhaseDocumentRepository } from "../phase/documents/phase.doc.repository";
import { ProjectDocumentStatus } from "../phase/documents/phase.doc.model";

export class PhaseActivityService {

    constructor(
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly documentRepo: IPhaseDocumentRepository,
        private readonly projectAuth: ProjectAuth
    ) { }


    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(
        dto: CreatePhaseActivityDto,
        userId: string
    ) {
        const { project, phase } = dto;

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                project,
                userId,
                PERMISSIONS.PHASE_ACTIVITY.CREATE
            );

        // A lead PI can add activities only while the project is a draft.
        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        // Validate before touching the DB.
        this.validateCost(dto.cost, dto.detailCost);

        try {
            // `kind` and `details` travel inside dto. The model validates
            // `details` against `kind` and returns a ValidationError if invalid.
            return await this.activityRepo.create({
                ...dto,
                phase: phase || undefined
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
        dto: UpdatePhaseActivityDto & {
            id: string;
            userId: string;
        }
    ) {
        const { id, data, userId } = dto;

        const activityDoc =
            await this.activityRepo.findById(id);

        if (!activityDoc) {
            throw new AppError(ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND);
        }

        if (!activityDoc.project) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        if (!activityDoc.phase) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                activityDoc.project.toString(),
                userId,
                PERMISSIONS.PHASE_ACTIVITY.UPDATE
            );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        // Detect activity kind changes.
        const kindChanged =
            data.kind !== undefined &&
            data.kind !== activityDoc.kind;

        // A new kind requires new details.
        if (kindChanged && data.details == null) {
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_DETAILS_REQUIRED
            );
        }

        // Re-validate cost on the merged result, but only when the
        // update touches cost or detailCost.
        if (data.cost !== undefined || data.detailCost !== undefined) {
            const effectiveCost =
                data.cost !== undefined ? data.cost : activityDoc.cost;

            const effectiveDetailCost =
                data.detailCost !== undefined
                    ? data.detailCost
                    : activityDoc.detailCost;

            this.validateCost(
                effectiveCost,
                effectiveDetailCost ?? undefined
            );
        }

        // Prevent project changes.
        const {
            //project: _ignoredProject,
            ...updateData
        } = data;

        return this.activityRepo.update(id, updateData, userId);
    }

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
    // TRANSITION
    // ---------------------------------------------------

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

        // Planning is only possible while the phase is proposed.
        if (to === PhaseActivityStatus.planned) {
            if (phaseDoc.status !== PhaseStatus.proposed) {
                throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);
            }
        }

        // Activity execution is only possible while its phase is active.
        const executionStates = [
            PhaseActivityStatus.active,
            PhaseActivityStatus.completed,
            PhaseActivityStatus.cancelled,
        ];

        const involvesExecution =
            executionStates.includes(from) ||
            executionStates.includes(to);

        if (involvesExecution && phaseDoc.status !== PhaseStatus.active) {
            throw new AppError(ERROR_CODES.PHASE_NOT_ACTIVE);
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

        return await this.activityRepo.updateStatus(id, to, userId, reason);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------

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

        // Authorize directly against the activity's project
        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                String(activity.project),
                userId,
                PERMISSIONS.PHASE_ACTIVITY.DELETE
            );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        // Phase is optional: only check it when the activity has one
        if (activity.phase) {
            const phaseDoc =
                await this.phaseRepo.findById(String(activity.phase));

            if (!phaseDoc) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            if (phaseDoc.status !== PhaseStatus.proposed) {
                throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);
            }
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