

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
import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { PhaseStatus } from "../phase/phase.model";
import { IPhaseRepository } from "../phase/phase.repository";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";


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
        const { project, phase } = dto;

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                project,
                userId,
                PERMISSIONS.PHASE_EQUIPMENT.CREATE
            );

        // A lead PI can add equipment only while the project is a draft.
        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        // Validate the phase only when provided.
        if (phase) {
            const phaseDoc = await this.phaseRepo.findById(phase);

            if (!phaseDoc) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            // Ensure the phase belongs to the specified project.
            if (String(phaseDoc.project) !== String(project)) {
                throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            }

            // Lead PIs may add equipment only to proposed phases.
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
            return await this.equipmentRepo.create({
                ...dto,
                phase: phase || undefined,
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
        const { id, data, userId } = dto;

        const equipment =
            await this.equipmentRepo.findById(id);

        if (!equipment) {
            throw new AppError(
                ERROR_CODES.PHASE_EQUIPMENT_NOT_FOUND
            );
        }

        // The project is immutable and is determined by the existing equipment.
        const projectId = String(equipment.project);

        const {
            projectDoc,
            isLeadPI,
        } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.PHASE_EQUIPMENT.UPDATE
        );

        // A lead PI can update equipment only while the project is a draft.
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
            const phaseDoc =
                await this.phaseRepo.findById(data.phase);

            if (!phaseDoc) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_FOUND
                );
            }

            // The phase must belong to the equipment's original project.
            if (
                String(phaseDoc.project) !== projectId
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_FOUND
                );
            }

            // Lead PIs can assign equipment only to proposed phases.
            if (
                isLeadPI &&
                phaseDoc.status !== PhaseStatus.proposed
            ) {
                throw new AppError(
                    ERROR_CODES.PHASE_NOT_PROPOSED
                );
            }
        }

        // Prevent project changes, regardless of the submitted data.
        const { ...updateData } = data;

        return await this.equipmentRepo.update(
            id,
            updateData
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


        const phaseId =
            String(equipment.phase);

        const phaseDoc =
            await this.phaseRepo.findById(phaseId);

        if (!phaseDoc)
            throw new AppError(
                ERROR_CODES.PHASE_NOT_FOUND
            );


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