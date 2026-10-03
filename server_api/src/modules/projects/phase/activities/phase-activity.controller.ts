import { Request, Response } from "express";
import { DeleteDto } from "../../../../common/dtos/delete.dto";
import {
    successResponse,
    errorResponse,
} from "../../../../common/helpers/response";
import { AuthenticatedRequest } from "../../../auth/auth.middleware";
import {
    CreatePhaseActivityDto,
    FilterPhaseActivities,
    UpdatePhaseActivityDto,
} from "./phase-activity.dto";
import { IPhaseActivityDetailCost } from "./phase-activity.model";
import { PhaseActivityService } from "./phase-activity.service";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { TransitionRequestDto } from "../../../../common/dtos/transition.dto";

/**
 * Normalises the raw detailCost from the request body.
 * Returns undefined when it is not provided.
 */
const parseDetailCost = (
    value: any
): IPhaseActivityDetailCost | undefined => {
    if (value === undefined || value === null) return undefined;

    return {
        participants: Number(value.participants),
        unitPrice: Number(value.unitPrice),
        duration: Number(value.duration)
    };
};

/**
 * Converts a raw value to a Date, or undefined when not provided.
 * Invalid values become an Invalid Date, which the service rejects.
 */
const parseDate = (value: any): Date | undefined =>
    value === undefined || value === null ? undefined : new Date(value);

export class PhaseActivityController {

    constructor(
        private readonly service: PhaseActivityService
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
                title,
                description,
                cost,
                detailCost,
                startDate,
                endDate,
            } = req.body;

            const data: CreatePhaseActivityDto = {
                phase: phase as string,
                title,
                description,

                cost: Number(cost),
                detailCost: parseDetailCost(detailCost),

                // required; a missing value becomes an Invalid Date
                // and is rejected by the service
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            };

            const created =
                await this.service.create(data, req.auth.userId);

            successResponse(
                res,
                201,
                "Phase activity created successfully",
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

            const filter: FilterPhaseActivities = {
                phase: phase as string,
                status: status as any,
            };

            const activities =
                await this.service.getActivities(
                    filter,
                    {
                        populate: true,
                    }
                );

            successResponse(
                res,
                200,
                "Phase activities fetched successfully",
                activities
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

            const activity =
                await this.service.getById(
                    String(id),
                    {
                        populate: true,
                    }
                );

            successResponse(
                res,
                200,
                "Phase activity fetched successfully",
                activity
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
                title,
                description,
                cost,
                detailCost,
                startDate,
                endDate,
            } = req.body;

            const dto: UpdatePhaseActivityDto & {
                id: string;
                userId: string;
            } = {
                id: String(id),

                data: {
                    title,
                    description,

                    cost: cost !== undefined ? Number(cost) : undefined,
                    detailCost: parseDetailCost(detailCost),

                    startDate: parseDate(startDate),
                    endDate: parseDate(endDate),
                },

                userId: req.auth.userId,
            };

            const updated =
                await this.service.update(dto);

            successResponse(
                res,
                200,
                "Phase activity updated successfully",
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
            const { current, next } = req.body;

            const dto: TransitionRequestDto = {
                id: String(id),
                current,
                next,
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
                "Phase activity status updated successfully",
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
                "Phase activity deleted successfully",
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