import { Request, Response } from "express";
import { VerificationConfigurationService } from "./verification-conf.service";
import {
    CreateVerificationConfigurationDTO,
    FilterConfigurationDTO,
    UpdateVerificationConfigurationDTO
} from "./verification-conf.dto";
import {
    successResponse,
    errorResponse
} from "../../../common/helpers/response";
import { VerificationConfigurationStatus } from "./verification-conf.model";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { AppError } from "../../../common/errors/app.error";

export class VerificationConfigurationController {

    constructor(
        private readonly service: VerificationConfigurationService
    ) { }


    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
             if (!req.auth) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }
            const dto =
                req.body as CreateVerificationConfigurationDTO;

            const configuration =
                await this.service.create(dto, req.auth.userId);

            successResponse(
                res,
                201,
                "Verification configuration created successfully",
                configuration
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


    get = async (
        req: Request,
        res: Response
    ) => {
        try {

            const {
                deadline,
                status
            } = req.query;

            const filters: FilterConfigurationDTO = {
                deadline: deadline
                    ? new Date(String(deadline))
                    : undefined,

                status:
                    typeof status === "string"
                        ? status as VerificationConfigurationStatus
                        : undefined
            };

            const configurations =
                await this.service.get(
                    filters,
                    {
                        populate: true
                    }
                );

            successResponse(
                res,
                200,
                "Verification configurations fetched successfully",
                configurations
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



    getUpcoming = async (
        req: Request,
        res: Response
    ) => {
        try {
            const configurations =
                await this.service.getUpcoming({ populate: true });

            successResponse(
                res,
                200,
                "Upcoming verification configurations fetched successfully",
                configurations
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

    getById = async (
        req: Request,
        res: Response
    ) => {
        try {
            const { id } = req.params;

            const configuration =
                await this.service.getById(id, { populate: true });

            successResponse(
                res,
                200,
                "Verification configuration fetched successfully",
                configuration
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


    update = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {

        if (!req.auth) {
            throw new Error(ERROR_CODES.UNAUTHORIZED);
        }
        try {
            const { id } = req.params;

            const dto =
                req.body as UpdateVerificationConfigurationDTO;

            const configuration =
                await this.service.update(
                    id,
                    dto, req.auth.userId
                );

            successResponse(
                res,
                200,
                "Verification configuration updated successfully",
                configuration
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


    transitionState = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;
            const { current, next } = req.body;

            const dto: TransitionRequestDto = {
                id: String(id),
                current,
                next,
                userId: req.auth.userId,
            };

            const updated = await this.service.transitionState(dto, req.auth.userId);

            successResponse(
                res,
                200,
                "Verification configuration status updated successfully",
                updated
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    delete = async (
        req: Request,
        res: Response
    ) => {
        try {
            const { id } = req.params;

            await this.service.delete(id);

            successResponse(
                res,
                200,
                "Verification configuration deleted successfully"
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