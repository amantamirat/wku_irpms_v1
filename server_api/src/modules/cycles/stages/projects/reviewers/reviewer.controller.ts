// reviewer.controller.ts
import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../../util/response";
import { ReviewerService } from "./reviewer.service";
import { CreateReviewerDTO, GetReviewersDTO, UpdateReviewerDTO, DeleteReviewerDTO } from "./reviewer.dto";
import { AuthenticatedRequest } from "../../../../users/auth/auth.middleware";

const reviewerService = new ReviewerService();

export class ReviewerController {

    static async createReviewer(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { projectStage, applicant, weight } = req.body;

            const data: CreateReviewerDTO = {
                projectStageId: projectStage,
                applicantId: applicant,
                weight: weight,
                userId: req.user._id
            };

            const created = await reviewerService.createReviewer(data);
            successResponse(res, 201, "Reviewer created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getReviewers(req: Request, res: Response) {
        try {
            const { projectStage, applicant } = req.query;
            // map to DTO
            const filter: GetReviewersDTO = {
                projectStageId: projectStage ? String(projectStage) : undefined,
                applicantId: applicant ? String(applicant) : undefined
            };
            const reviewers = await reviewerService.getReviewers(filter);
            successResponse(res, 200, "Reviewers fetched successfully", reviewers);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateReviewer(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;
            const { status, weight, } = req.body;

            const dto: UpdateReviewerDTO = {
                id,
                data: { status, weight },
                userId: req.user._id
            };

            const updated = await reviewerService.updateReviewer(dto);
            successResponse(res, 200, "Reviewer updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteReviewer(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;
            const dto: DeleteReviewerDTO = {
                id,
                userId: req.user._id
            };

            const deleted = await reviewerService.deleteReviewer(dto);
            successResponse(res, 200, "Reviewer deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
