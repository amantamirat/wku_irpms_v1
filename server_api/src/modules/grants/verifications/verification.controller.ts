import { Request, Response } from "express";
import { VerificationService } from "./verification.service";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../auth/auth.middleware";


export class VerificationController {

    constructor(
        private readonly service: VerificationService
    ) { }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {

            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const verification = await this.service.create(req.body);

            successResponse(res, 201, "Verification created successfully", verification);

        } catch (err: any) {

            errorResponse(res, 400, err.message, err);

        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {

            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const verification = await this.service.update(
                req.params.id,
                req.body
            );

            successResponse(res, 200, "Verification updated successfully", verification);

        } catch (err: any) {

            errorResponse(
                res,
                400,
                err.message,
                err
            );

        }
    };

    findById = async (req: Request, res: Response) => {
        try {

            const verification = await this.service.findById(
                req.params.id
            );

            successResponse(
                res,
                200,
                "Verification retrieved successfully",
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

    

    findAll = async (_req: Request, res: Response) => {
        try {

            const verifications = await this.service.findAll();

            successResponse(
                res,
                200,
                "Verifications retrieved successfully",
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

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {

            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const verification = await this.service.delete(
                req.params.id
            );

            successResponse(
                res,
                200,
                "Verification deleted successfully",
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
}