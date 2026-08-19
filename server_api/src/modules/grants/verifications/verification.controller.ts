import { Request, Response } from "express";
import { CreateVerificationDTO } from "./verification.dto";
import {
    successResponse,
    errorResponse
} from "../../../common/helpers/response";
import { VerificationService } from "./verification.serive";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";

export class VerificationController {

    constructor(
        private readonly service: VerificationService
    ) { }


    create = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new AppError(
                    ERROR_CODES.UNAUTHORIZED
                );
            }

            const dto =
                req.body as CreateVerificationDTO;

            if (!req.file) {
                throw new AppError(
                    ERROR_CODES.FILE_NOT_FOUND
                );
            }

            const documentPath =
                req.file.path;

            const submittedBy =
                String(req.auth.userId);

            const verification =
                await this.service.create(
                    dto,
                    documentPath,
                    submittedBy
                );

            successResponse(
                res,
                201,
                "Verification submitted successfully",
                verification
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

            const verification =
                await this.service.getById(id);

            successResponse(
                res,
                200,
                "Verification fetched successfully",
                verification
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


    getByConfiguration = async (
        req: Request,
        res: Response
    ) => {
        try {
            const { configurationId } = req.params;

            const verifications =
                await this.service.getByConfiguration(
                    configurationId
                );

            successResponse(
                res,
                200,
                "Configuration verifications fetched successfully",
                verifications
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