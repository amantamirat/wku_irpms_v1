import { Request, Response } from "express";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import {
    CreateReviewerDTO,
    GetReviewersDTO,
    UpdateReviewerDTO,
} from "./reviewer.dto";
import { ReviewerService } from "./reviewer.service";

export class ReviewerController {


    constructor(private readonly service: ReviewerService) {
    }

    // -----------------------
    // CREATE
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { projectStage, reviewer, weight } = req.body;

            const dto: CreateReviewerDTO = {
                projectStage,
                reviewer,
                weight,
                userId: req.auth.userId
            };
            const created = await this.service.create(dto);
            successResponse(res, 201, "Reviewer created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // GET
    // -----------------------
    get = async (req: Request, res: Response) => {
        try {
            const { projectStage, reviewer, populate, status } = req.query;

            const filter: GetReviewersDTO = {
                projectStage: projectStage ? String(projectStage) : undefined,
                reviewer: reviewer ? String(reviewer) : undefined,
                ...(populate !== undefined && { populate: populate === "true" }),

                // Handle status: if it's an array, keep it; if it's a string, use it; else undefined
                status: status ? (Array.isArray(status) ? status.map(String) : String(status)) : undefined
            };

            const reviewers = await this.service.getReviewers(filter);
            successResponse(res, 200, "Reviewers fetched successfully", reviewers);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // UPDATE (weight)
    // -----------------------
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const { weight } = req.body;
            const dto: UpdateReviewerDTO = {
                id: String(id),
                data: { weight },
                userId: req.auth.userId
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, "Reviewer updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

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
            successResponse(res, 200, "Reviewer status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // DELETE
    // -----------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Reviewer deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
