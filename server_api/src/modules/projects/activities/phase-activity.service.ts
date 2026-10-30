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
import {
    IPhaseActivityRepository,
} from "./phase-activity.repository";
import {
    IPhaseActivityDetailCost,
    PhaseActivityStatus,
} from "./phase-activity.model";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";

export class PhaseActivityService {

    constructor(
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly phaseRepo: IPhaseRepository,
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
        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        // A phase is optional. Validate it only when provided.
        if (phase) {
            const phaseDoc = await this.phaseRepo.findById(phase);

            if (!phaseDoc) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            // Ensure the phase belongs to the specified project.
            if (String(phaseDoc.project) !== String(project)) {
                throw new AppError(ERROR_CODES.PHASE_PROJECT_MISMATCH);
            }

            // Lead PIs may add activities only to proposed phases.
            if (
                isLeadPI &&
                phaseDoc.status !== PhaseStatus.proposed
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_PROPOSED
                );
            }
        }

        try {
            this.validateCost(dto.cost, dto.detailCost);

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
        return await this.activityRepo.find(
            filter,
            options
        );
    }


    // ---------------------------------------------------
    // GET BY ID
    // ---------------------------------------------------

    async getById(
        id: string,
        options?: FilterOptions
    ) {

        const activity =
            await this.activityRepo.findById(
                id,
                options
            );

        if (!activity)
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );

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

        const activity =
            await this.activityRepo.findById(id);

        if (!activity) {
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );
        }

        if (activity.status !== PhaseActivityStatus.planned) {
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );
        }


        // Changing the kind makes the old details meaningless,
        // so a full set of new details must come with it.
        if (
            data.kind !== undefined &&
            data.kind !== activity.kind &&
            !data.details
        ) {
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_DETAILS_REQUIRED
            );
        }

        // Determine the immutable project from the existing phase,
        // if the activity currently belongs to a phase.
        let projectId: string;

        if (activity.phase) {
            const currentPhase =
                await this.phaseRepo.findById(
                    String(activity.phase)
                );

            if (!currentPhase) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_FOUND
                );
            }

            projectId = String(currentPhase.project);

            if (
                currentPhase.status === PhaseStatus.completed
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_ALREADY_COMPLETED
                );
            }
        } else {
            // For activities without a phase, the project must be
            // available from the activity itself.
            projectId = String(activity.project);
        }

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE_ACTIVITY.UPDATE
        );

        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT
            );
        }

        // Validate the new phase only when provided.
        if (data.phase) {
            const newPhase =
                await this.phaseRepo.findById(data.phase);

            if (!newPhase) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_FOUND
                );
            }

            // The new phase must belong to the same immutable project.
            if (
                String(newPhase.project) !== projectId
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_FOUND
                );
            }

            if (
                newPhase.status === PhaseStatus.completed
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_ALREADY_COMPLETED
                );
            }

            if (
                isLeadPI &&
                newPhase.status !== PhaseStatus.proposed
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_PROPOSED
                );
            }
        }

        // Prevent project changes, regardless of submitted data.
        const {
            // project: _ignoredProject,
            ...updateData
        } = data;

        return await this.activityRepo.update(
            id,
            updateData
        );
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

        const {
            id,
            next,
            current,
            reason
        } = dto;

        const activity =
            await this.activityRepo.findById(id);

        if (!activity)
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );

        const from =
            activity.status as PhaseActivityStatus;

        const to =
            next as PhaseActivityStatus;

        if (current && current !== from) {
            throw new AppError(
                ERROR_CODES.STATE_OUT_OF_SYNC
            );
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PHASE_ACTIVITY_TRANSITIONS
        );

        if (!activity.phase) {
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        }

        const phaseDoc =
            await this.phaseRepo.findById(String(activity.phase));

        if (!phaseDoc)
            throw new AppError(
                ERROR_CODES.PHASE_NOT_FOUND
            );

        /**
         * Activity execution is only possible
         * while its phase is active.
         */
        if (to === PhaseActivityStatus.planned) {

            if (phaseDoc.status !== PhaseStatus.proposed) {
                throw new AppError(ERROR_CODES.PHASE_NOT_PROPOSED);
            }
        }
        const executionStates = [
            PhaseActivityStatus.active,
            PhaseActivityStatus.completed,
            PhaseActivityStatus.cancelled,
        ];

        const involvesExecution =
            executionStates.includes(from) ||
            executionStates.includes(to);

        if (
            involvesExecution &&
            phaseDoc.status !== PhaseStatus.active
        ) {
            throw new AppError(
                ERROR_CODES.PHASE_NOT_ACTIVE
            );
        }

        return await this.activityRepo.updateStatus(
            id,
            to,
            userId,
            reason
        );
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

        if (!activity)
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );

        // Authorize directly against the activity's project
        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            String(activity.project),
            userId,
            PERMISSIONS.PHASE_ACTIVITY.DELETE
        );

        if (isLeadPI && projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT
            );
        }

        // Phase is optional: only check it when the activity has one
        if (activity.phase) {
            const phaseDoc =
                await this.phaseRepo.findById(
                    String(activity.phase)
                );

            if (!phaseDoc)
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_FOUND
                );

            if (phaseDoc.status !== PhaseStatus.proposed) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_PROPOSED
                );
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