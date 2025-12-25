// reviewer.controller.ts
import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../../common/helpers/response";
import { ReviewerService } from "./reviewer.service";
import { CreateReviewerDTO, GetReviewersDTO, UpdateReviewerDTO, DeleteReviewerDTO } from "./reviewer.dto";
import { AuthenticatedRequest } from "../../../../users/user.middleware";

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
                userId: req.user.userId
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

    // Change reviewer status (activate, submit, approve)
    static async changeReviewerStatus(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;
            const { status } = req.body;

            const dto: UpdateReviewerDTO = { id, data: { status }, userId: req.user.userId };
            const updated = await reviewerService.changeReviewerStatus(dto);

            successResponse(res, 200, `Reviewer status changed to ${status}`, updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateReviewer(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;
            const { weight, } = req.body;

            const dto: UpdateReviewerDTO = {
                id,
                data: { weight },
                userId: req.user.userId
            };

            const updated = await reviewerService.updateReviewerData(dto);
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
                userId: req.user.userId
            };

            const deleted = await reviewerService.delete(dto);
            successResponse(res, 200, "Reviewer deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
