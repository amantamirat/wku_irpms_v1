import { Request, Response } from "express";
import { DeleteDto } from "../../../../common/dtos/delete.dto";
import {
    successResponse,
    errorResponse,
} from "../../../../common/helpers/response";
import { AuthenticatedRequest } from "../../../auth/auth.middleware";
import {
    CreatePhaseEquipmentDto,
    FilterPhaseEquipments,
    UpdatePhaseEquipmentDto,
} from "./phase-equipment.dto";
import { PhaseEquipmentService } from "./phase-equipment.service";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { TransitionRequestDto } from "../../../../common/dtos/transition.dto";

export class PhaseEquipmentController {

    constructor(
        private readonly service: PhaseEquipmentService
    ) { }


    // -----------------------
    // Create
    // -----------------------
    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const {
                phase,
                description,
                unit,
                unitPrice,
                quantity,
                requiredBy,
            } = req.body;

            const data: CreatePhaseEquipmentDto = {
                phase: phase as string,
                description,
                unit,
                unitPrice:
                    unitPrice !== undefined
                        ? Number(unitPrice)
                        : undefined,
                quantity: Number(quantity),
                requiredBy,
                createdBy: req.auth.userId,
            };

            const created =
                await this.service.create(data, req.auth.userId);

            successResponse(
                res,
                201,
                "Phase equipment created successfully",
                created
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    // -----------------------
    // Fetch / Query
    // -----------------------
    get = async (
        req: Request,
        res: Response
    ) => {
        try {
            const {
                phase,
                status,
            } = req.query;

            const filter: FilterPhaseEquipments = {
                phase: phase as string,
                status: status as any,
            };

            const equipments =
                await this.service.getEquipments(
                    filter,
                    {
                        populate: true,
                    }
                );

            successResponse(
                res,
                200,
                "Phase equipments fetched successfully",
                equipments
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    // -----------------------
    // Get By ID
    // -----------------------
    getById = async (
        req: Request,
        res: Response
    ) => {
        try {
            const { id } = req.params;

            const equipment =
                await this.service.getById(
                    String(id),
                    {
                        populate: true,
                    }
                );

            successResponse(
                res,
                200,
                "Phase equipment fetched successfully",
                equipment
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    // -----------------------
    // Update
    // -----------------------
    update = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;

            const {
                description,
                unit,
                unitPrice,
                quantity,
                requiredBy,
            } = req.body;

            const dto: UpdatePhaseEquipmentDto & {
                id: string;
                userId: string;
            } = {
                id: String(id),

                data: {
                    description,
                    unit,
                    unitPrice:
                        unitPrice !== undefined
                            ? Number(unitPrice)
                            : undefined,
                    quantity:
                        quantity !== undefined
                            ? Number(quantity)
                            : undefined,
                    requiredBy,
                    updatedBy: req.auth.userId,
                },

                userId: req.auth.userId,
            };

            const updated =
                await this.service.update(dto);

            successResponse(
                res,
                200,
                "Phase equipment updated successfully",
                updated
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    // -----------------------
    // Transition State
    // -----------------------
    transitionState = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const { current, next, reason } = req.body;

            const dto: TransitionRequestDto & { reason?: string } = {
                id: String(id),
                current,
                next,
                reason,
                userId: req.auth.userId,
            };

            const updated =
                await this.service.transitionState(
                    dto,
                    req.auth.userId
                );

            successResponse(
                res,
                200,
                "Phase equipment status updated successfully",
                updated
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };


    // -----------------------
    // Delete
    // -----------------------
    delete = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;

            const dto: DeleteDto = {
                id: String(id),
            };

            const deleted =
                await this.service.delete(
                    dto,
                    req.auth.userId
                );

            successResponse(
                res,
                200,
                "Phase equipment deleted successfully",
                deleted
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };
}