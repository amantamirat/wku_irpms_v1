import { Request, Response } from "express";
import { ReviewerService } from "./reviewer.service";
import {
    CreateReviewerDTO,
    GetReviewersDTO,
    UpdateReviewerDTO
} from "./reviewer.dto";
import { AuthenticatedRequest } from "../../../../users/user.middleware";
import { successResponse, errorResponse } from "../../../../../common/helpers/response";

export class ReviewerController {

    private service: ReviewerService;

    constructor(service?: ReviewerService) {
        this.service = service || new ReviewerService();
    }

    // -----------------------
    // CREATE
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }

            const { projectStage, applicant, weight } = req.body;

            const dto: CreateReviewerDTO = {
                projectStage,
                applicant,
                weight,
                userId: req.user.userId
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
            const { projectStage, applicant } = req.query;

            const filter: GetReviewersDTO = {
                projectStage: projectStage ? String(projectStage) : undefined,
                applicant: applicant ? String(applicant) : undefined
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
            if (!req.user) {
                throw new Error("User not found!");
            }

            const { id } = req.query;
            if (!id) {
                throw new Error("id not found!");
            }

            const { weight } = req.body;

            const dto: UpdateReviewerDTO = {
                id: String(id),
                data: { weight },
                applicantId: req.user.userId
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Reviewer updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // UPDATE STATUS
    // -----------------------
    updateStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const { id } = req.params; 
            const { status } = req.body;

            const dto: UpdateReviewerDTO = {
                id: String(id),
                data: { status },
                applicantId: req.user.applicantId
            };

            const updated = await this.service.updateStatus(dto);
            successResponse(
                res,
                200,
                `Reviewer status changed to ${status}`,
                updated
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // DELETE
    // -----------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const { id } = req.params;

            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Reviewer deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
