import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { CreateApplicationDTO, FilterApplicationDTO } from "./application.dto";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { ApplicationService } from "./application.service";
import { ApplicationStatus } from "./application.model";

export class ApplicationController {

    private buildFilter(query: Request["query"]): FilterApplicationDTO {
        const {
            project,
            stage,
            status,
            reviewerAssigner
        } = query;

        return {
            project: project
                ? String(project)
                : undefined,

            stage: stage
                ? String(stage)
                : undefined,

            status:
                status ? String(status) as ApplicationStatus
                    : undefined,

            reviewerAssigner: reviewerAssigner
                ? String(reviewerAssigner)
                : undefined
        };
    }

    constructor(private readonly service: ApplicationService) {
    }
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);
            if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

            // documentPath is set by the service, never trusted from the client
            const { documentPath, ...application } = JSON.parse(
                req.body.application
            ) as CreateApplicationDTO;

            const created = await this.service.create(
                application,
                req.auth.userId,
                req.file
            );

            successResponse(res, 201, "Project application created successfully", created);
        } catch (err: any) {
            // Temp file cleanup now lives in the service
            errorResponse(res, 400, err.message, err);
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

            const updated = await this.service.transitionState(dto, req.auth.userId);
            successResponse(res, 200, "Application status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------
    get = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const filter = this.buildFilter(req.query);

            const applications = await this.service.readApplications(
                filter,
                req.auth.scope,
                { populate: true }
            );

            successResponse(
                res,
                200,
                "Applications fetched successfully",
                applications
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    lookup = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) {
                return
            }
            const { project, stage, status, populate, skip, limit } = req.query;

            const filter = this.buildFilter(req.query);

            const applications = await this.service.get(filter, { populate: true });
            //const applications = await this.service.get(dto, { populate: true });

            successResponse(res, 200, "Project documents fetched successfully", applications);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const doc = await this.service.getById(id);
            successResponse(res, 200, 'doc fetched', doc);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    anonymize = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const doc =
                await this.service.anonymizeApplication(id);

            successResponse(
                res,
                200,
                "Application anonymized successfully",
                doc
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


    getMyAssignedApplications = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const filter = this.buildFilter(req.query);

            const applications =
                await this.service.getMyAssignedApplications(
                    req.auth.userId,
                    filter,
                    { populate: true }
                );

            successResponse(
                res,
                200,
                "My assigned applications fetched successfully",
                applications
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    updateReviewerAssigner = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;
            const { reviewerAssigner } = req.body;

            const updated = await this.service.updateReviewerAssigner(
                id,
                reviewerAssigner ?? null,
                req.auth.userId
            );

            successResponse(
                res,
                200,
                "Application reviewer assigner updated successfully",
                updated
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };



    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const userId = req.auth.userId;
            const dto: DeleteDto = {
                id,
            };

            // Your service deletes the record and returns the deleted document metadata
            const deletedDoc = await this.service.delete(dto, userId);
            /*

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
*/
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
