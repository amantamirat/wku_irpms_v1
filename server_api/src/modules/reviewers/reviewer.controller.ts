import { Request, Response } from "express";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import {
    CreateReviewerDTO,
    FilterReviewersDto,
    UpdateReviewerDTO,
} from "./reviewer.dto";
import { ReviewerService } from "./reviewer.service";
import { ReviewerStatus } from "./reviewer.state-machine";



export class ReviewerController {

    private buildFilter(query: Request["query"]): FilterReviewersDto {
        const {
            project,
            application,
            verification,
            reviewer,
            status
        } = query;

        return {
            project: project
                ? String(project)
                : undefined,

            application: application
                ? String(application)
                : undefined,

            verification: verification
                ? String(verification)
                : undefined,

            reviewer: reviewer
                ? String(reviewer)
                : undefined,

            status: status
                ? Array.isArray(status)
                    ? status.map(String) as ReviewerStatus[]
                    : String(status) as ReviewerStatus
                : undefined
        };
    }


    constructor(private readonly service: ReviewerService) {
    }

    // -----------------------
    // CREATE
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { targetType, verification, application, reviewer, weight } = req.body;

            const dto: CreateReviewerDTO = {
                targetType: targetType,
                verification: verification,
                application: application,
                reviewer,
                weight
            };
            const created = await this.service.create(dto, req.auth.userId);
            successResponse(res, 201, "Reviewer created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // GET
    // -----------------------
    get = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const filter = this.buildFilter(req.query);

            const reviewers = await this.service.read(
                filter,
                req.auth.scope,
                { populate: true }
            );

            successResponse(
                res,
                200,
                "Reviewers fetched successfully",
                reviewers
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // LOOKUP NO POPULATE
    // -----------------------
    lookup = async (
        req: Request,
        res: Response
    ) => {
        try {
            const filter = this.buildFilter(req.query);

            const reviewers =
                await this.service.getReviewers(filter, { populate: true });

            successResponse(
                res,
                200,
                "Reviewers fetched successfully",
                reviewers
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    getMyEvaluations = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const { status } = req.query;
            const evaluations = await this.service.getMyEvaluations(
                req.auth.userId, { status: status ? status as ReviewerStatus : undefined }
            );

            successResponse(
                res,
                200,
                "My evaluations fetched successfully",
                evaluations
            );
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
            };
            const updated = await this.service.update(dto, req.auth.userId);
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
            };
            const updated = await this.service.transitionState(dto, req.auth.userId);
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
