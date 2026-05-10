import { Request, Response } from "express";
import fs from "fs";
import { errorResponse, successResponse } from "../../../common/helpers/response";

import {
    CreateProjectStageDTO,
    GetProjectStageDTO
} from "./project.stage.dto";

import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { ProjectStageService } from "./project.stage.service";

export class ProjectStageController {



    constructor(private readonly service: ProjectStageService) {
    }
    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }
            if (!req.file) throw new Error(ERROR_CODES.FILE_NOT_FOUND);

            const { project } = req.body;

            const dto: CreateProjectStageDTO = {
                project,
                grantStage: '',
                documentPath: `uploads/${req.file.filename}`,
                applicantId: req.auth.userId
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, "Project document created successfully", created);

        } catch (err: any) {
            if (req.file) {
                fs.unlink(`uploads/${req.file.filename}`, () => { });
            }
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
                applicantId: req.auth.userId,
            };

            const updated = await this.service.transitionState(dto);
            successResponse(res, 200, "Project Stage status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    // ---------------------------------------------------
    // CALCULATE TOTAL SCORE
    // ---------------------------------------------------
    calculateTotalScore = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }
            const { id } = req.params;

            const score = await this.service.calculateTotalScore(String(id));

            successResponse(
                res,
                200,
                "Total score calculated successfully",
                { totalScore: score }
            );

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
    // ---------------------------------------------------
    // GET
    // ---------------------------------------------------
    get = async (req: Request, res: Response) => {
        try {
            const { project, grantStage, grantAllocation, callStage, status, populate, skip, limit } = req.query;

            const dto: GetProjectStageDTO = {
                project: project as string,
                grantStage: grantStage as string,
                grantAllocation: grantAllocation as string,
                callStage: callStage as string,
                status: status as any,
                ...(populate !== undefined && { populate: populate === "true" }),
                skip: skip ? Number(skip) : undefined,
                limit: limit ? Number(limit) : undefined,
            };

            const docs = await this.service.get(dto);
            successResponse(res, 200, "Project documents fetched successfully", docs);

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


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const dto: DeleteDto = {
                id,
                userId: req.auth.userId,
            };

            const deletedDoc = await this.service.delete(dto);

            if (deletedDoc?.documentPath) {
                fs.unlink(deletedDoc.documentPath, () => { });
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
