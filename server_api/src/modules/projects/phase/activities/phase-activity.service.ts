import { PERMISSIONS } from "../../../../common/constants/permissions";
import { DeleteDto } from "../../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../../common/dtos/transition.dto";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { TransitionHelper } from "../../../../common/helpers/transition.helper";

import { ProjectAuth } from "../../project.auth";
import { IPhaseRepository } from "../phase.repository";
import { PhaseStatus } from "../phase.model";

import {
    CreatePhaseActivityDto,
    FilterPhaseActivities,
    UpdatePhaseActivityDto,
} from "./phase-activity.dto";
import {
    IPhaseActivityRepository,
} from "./phase-activity.repository";
import {
    PhaseActivityStatus,
} from "./phase-activity.model";
import { ProjectStatus } from "../../project.model";

export class PhaseActivityService {

    constructor(
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly projectAuth: ProjectAuth
    ) { }


    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(
        dto: CreatePhaseActivityDto, userId: string
    ) {

        const {
            phase
        } = dto;

        const phaseDoc = await this.phaseRepo.findById(phase);

        if (!phaseDoc)
            throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);

        if (phaseDoc.status !== PhaseStatus.proposed)
            throw new AppError(
                ERROR_CODES.PHASE_NOT_PROPOSED
            );

        const projectId = String(phaseDoc.project);

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                projectId,
                userId,
                PERMISSIONS.PHASE_ACTIVITY.CREATE
            );

        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(
                    ERROR_CODES.PROJECT_NOT_DRAFT
                );
            }
        }

        try {
            return await this.activityRepo.create({
                ...dto,
                phase,
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

        const {
            id,
            data,
            userId,
        } = dto;

        const activity =
            await this.activityRepo.findById(id);

        if (!activity)
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );

        const phaseId = String(activity.phase);

        const phaseDoc =
            await this.phaseRepo.findById(phaseId);

        if (!phaseDoc)
            throw new AppError(
                ERROR_CODES.PHASE_NOT_FOUND
            );

        if (
            phaseDoc.status !== PhaseStatus.proposed
        ) {
            throw new AppError(
                ERROR_CODES.PHASE_NOT_PROPOSED
            );
        }

        const projectId =
            String(phaseDoc.project);

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE_ACTIVITY.UPDATE
        );

        if (isLeadPI) {
            if (projectDoc.status !== "draft") {
                throw new AppError(
                    ERROR_CODES.PROJECT_NOT_DRAFT
                );
            }
        }

        return await this.activityRepo.update(
            id,
            data
        );
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

        const phaseId =
            String(activity.phase);

        const phaseDoc =
            await this.phaseRepo.findById(phaseId);

        if (!phaseDoc)
            throw new AppError(
                ERROR_CODES.PHASE_NOT_FOUND
            );

        const projectId =
            String(phaseDoc.project);

            /*
        await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE_ACTIVITY.UPDATE
        );*/

        /**
         * Activity execution is only possible
         * while its phase is active.
         */
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
            userId
        );
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------

    async delete(
        dto: DeleteDto,
        userId: string
    ) {

        const {
            id,
        } = dto;

        const activity =
            await this.activityRepo.findById(id);

        if (!activity)
            throw new AppError(
                ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND
            );

        const phaseId =
            String(activity.phase);

        const phaseDoc =
            await this.phaseRepo.findById(phaseId);

        if (!phaseDoc)
            throw new AppError(
                ERROR_CODES.PHASE_NOT_FOUND
            );

        if (
            phaseDoc.status !== PhaseStatus.proposed
        ) {
            throw new AppError(
                ERROR_CODES.PHASE_NOT_PROPOSED
            );
        }

        const projectId =
            String(phaseDoc.project);

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE_ACTIVITY.DELETE
        );

        if (isLeadPI) {
            if (projectDoc.status !== "draft") {
                throw new AppError(
                    ERROR_CODES.PROJECT_NOT_DRAFT
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