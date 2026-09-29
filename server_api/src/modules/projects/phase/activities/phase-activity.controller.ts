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
import { PhaseActivityService } from "./phase-activity.service";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { TransitionRequestDto } from "../../../../common/dtos/transition.dto";

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
                participants,
                //requiredDays,
                cost,
                startDate,
                endDate,
            } = req.body;

            const data: CreatePhaseActivityDto = {
                phase: phase as string,
                title,
                description,
                participants:
                    participants !== undefined
                        ? Number(participants)
                        : undefined,
                /*
        requiredDays:
            requiredDays !== undefined
                ? Number(requiredDays)
                : undefined,*/
                cost: Number(cost),
                startDate,
                endDate
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
                participants,
                //requiredDays,
                cost,
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
                    participants,
                    //requiredDays,
                    cost,
                    startDate,
                    endDate,
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