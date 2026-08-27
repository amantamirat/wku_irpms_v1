import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { CreateVerificationDTO } from "./verification.dto";
import {
    successResponse,
    errorResponse
} from "../../../common/helpers/response";
import { VerificationService } from "./verification.service";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { VerificationStatus } from "./verification.model";
import { FilterVerification } from "./verification.repository";

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

            const relativeDocPath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');

            const submittedBy =
                String(req.auth.userId);

            const verification =
                await this.service.create(
                    dto,
                    relativeDocPath,
                    submittedBy
                );

            successResponse(
                res,
                201,
                "Verification submitted successfully",
                verification
            );

        } catch (err: any) {
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error(`Failed to delete orphaned file at ${req.file?.path}:`, unlinkErr);
                });
            }
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


    /*
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

    getByProject = async (
        req: Request,
        res: Response
    ) => {
        try {
            const { projectId } = req.params;

            const verifications =
                await this.service.getByProject(
                    projectId
                );

            successResponse(
                res,
                200,
                "Project verifications fetched successfully",
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
    */


    find = async (
        req: Request,
        res: Response
    ) => {
        try {

            const {
                project,
                configuration,
                attempt,
                status
            } = req.query;

            const filters: FilterVerification = {
                project: project
                    ? String(project)
                    : undefined,

                configuration: configuration
                    ? String(configuration)
                    : undefined,

                attempt: attempt !== undefined
                    ? Number(attempt)
                    : undefined,

                status:
                    typeof status === "string"
                        ? status as VerificationStatus
                        : undefined
            };

            const verifications =
                await this.service.find(
                    filters,
                    {
                        populate: true
                    }
                );

            successResponse(
                res,
                200,
                "Verifications fetched successfully",
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

    // -----------------------
    // Transition State
    // -----------------------
    transitionState = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const { current, next } = req.body;

            const dto: TransitionRequestDto = {
                id: String(id),
                current: current,
                next: next,
                userId: req.auth.userId,
            };

            const updated = await this.service.transitionState(dto);
            successResponse(res, 200, "Verification status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const dto: DeleteDto = {
                id,
                userId: req.auth.userId,
            };

            // Your service deletes the record and returns the deleted document metadata
            const deletedDoc = await this.service.delete(dto);

            if (deletedDoc?.documentPath) {
                // ✅ CRITICAL FIX: Joins project root with the stored "uploads/projects/filename.pdf"
                const absolutePath = path.join(process.cwd(), deletedDoc.documentPath);

                fs.unlink(absolutePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Failed to delete physical file at ${absolutePath}:`, unlinkErr);
                    } else {
                        console.log(`Successfully deleted physical file: ${absolutePath}`);
                    }
                });
            }

            successResponse(
                res,
                200,
                "Project document deleted successfully",
                deletedDoc
            );

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}