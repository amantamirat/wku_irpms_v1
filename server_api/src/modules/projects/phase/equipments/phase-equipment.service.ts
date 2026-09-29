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
    CreatePhaseEquipmentDto,
    FilterPhaseEquipments,
    UpdatePhaseEquipmentDto,
} from "./phase-equipment.dto";
import {
    IPhaseEquipmentRepository,
} from "./phase-equipment.repository";
import {
    PhaseEquipmentStatus,
} from "./phase-equipment.model";
import { ProjectStatus } from "../../project.model";

export class PhaseEquipmentService {

    constructor(
        private readonly equipmentRepo: IPhaseEquipmentRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly projectAuth: ProjectAuth
    ) { }


    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(
        dto: CreatePhaseEquipmentDto,
        userId: string
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
                PERMISSIONS.PHASE_EQUIPMENT.CREATE
            );

        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(
                    ERROR_CODES.PROJECT_NOT_DRAFT
                );
            }
        }

        try {
            return await this.equipmentRepo.create({
                ...dto,
                phase,
            });
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
        return await this.equipmentRepo.find(
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

        const equipment =
            await this.equipmentRepo.findById(
                id,
                options
            );

        if (!equipment)
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );

        return equipment;
    }


    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------

    async update(
        dto: UpdatePhaseEquipmentDto & {
            id: string;
            userId: string;
        }
    ) {

        const {
            id,
            data,
            userId,
        } = dto;

        const equipment =
            await this.equipmentRepo.findById(id);

        if (!equipment)
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );

        const phaseId = String(equipment.phase);

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
            PERMISSIONS.PHASE_EQUIPMENT.UPDATE
        );

        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(
                    ERROR_CODES.PROJECT_NOT_DRAFT
                );
            }
        }

        return await this.equipmentRepo.update(
            id,
            data
        );
    }


    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------

    async transitionState(
        dto: TransitionRequestDto & { reason?: string },
        userId: string
    ) {

        const {
            id,
            next,
            current,
            reason,
        } = dto;

        const equipment =
            await this.equipmentRepo.findById(id);

        if (!equipment)
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );

        const from =
            equipment.status as PhaseEquipmentStatus;

        const to =
            next as PhaseEquipmentStatus;

        if (current && current !== from) {
            throw new AppError(
                ERROR_CODES.STATE_OUT_OF_SYNC
            );
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PHASE_EQUIPMENT_TRANSITIONS
        );

        /**
         * Decisions that need an explanation.
         */
        /*
        const reasonRequiredStates = [
            PhaseEquipmentStatus.refused,
            PhaseEquipmentStatus.cancelled,
        ];

        if (
            reasonRequiredStates.includes(to) &&
            !reason?.trim()
        ) {
            throw new AppError(
                ERROR_CODES.STATUS_REASON_REQUIRED
            );
        }
*/
        const phaseId =
            String(equipment.phase);

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
            PERMISSIONS.PHASE_EQUIPMENT.UPDATE
        );*/

        /**
         * Delivery is only possible (or correctable)
         * while its phase is active.
         */
        const involvesDelivery =
            from === PhaseEquipmentStatus.delivered ||
            to === PhaseEquipmentStatus.delivered;

        if (
            involvesDelivery &&
            phaseDoc.status !== PhaseStatus.active
        ) {
            throw new AppError(
                ERROR_CODES.PHASE_NOT_ACTIVE
            );
        }

        return await this.equipmentRepo.updateStatus(
            id,
            to,
            userId,
            reason?.trim()
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

        const equipment =
            await this.equipmentRepo.findById(id);

        if (!equipment)
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );

        const phaseId =
            String(equipment.phase);

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
            PERMISSIONS.PHASE_EQUIPMENT.DELETE
        );

        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(
                    ERROR_CODES.PROJECT_NOT_DRAFT
                );
            }
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