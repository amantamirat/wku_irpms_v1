import { Request, Response } from 'express';
import { ReviewerService } from './reviewer.service';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../../../util/response';
import { ReviewerStatus } from './reviewer.enum';
import { CreateReviewerDto, GetReviewerOptions, UpdateReviewerDto } from './reviewer.dto';
import { DeleteDto } from '../../../../util/delete.dto';
import { AuthenticatedRequest } from '../../../users/auth/auth.middleware';

export class ReviewerController {

    static async createReviewer(req: Request, res: Response) {
        try {
            const { projectStage, applicant } = req.body;
            const data: CreateReviewerDto = {
                applicant: new mongoose.Types.ObjectId(applicant as string),
                projectStage: new mongoose.Types.ObjectId(projectStage as string)
            };
            const created = await ReviewerService.createReviewer(data);
            successResponse(res, 201, "Reviewer created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getReviewers(req: Request, res: Response) {
        try {

            const { projectStage, applicant } = req.query;
            const filter: GetReviewerOptions = {
                applicant: applicant ? new mongoose.Types.ObjectId(applicant as string) : undefined,
                projectStage: projectStage ? new mongoose.Types.ObjectId(projectStage as string) : undefined
            };
            const reviewers = await ReviewerService.getReviewers(filter);
            successResponse(res, 200, 'Reviewers fetched successfully', reviewers);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateReviewer(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { id } = req.params;
            const { status } = req.body;
            const dto: UpdateReviewerDto = {
                id: id,
                data: {
                    status: status as ReviewerStatus
                },
                userId: req.user._id,
            };
            const updated = await ReviewerService.updateReviewer(dto);
            successResponse(res, 201, "Reviewer updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteReviewer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const dto: DeleteDto = { id };
            const deleted = await ReviewerService.deleteReviewer(dto);
            successResponse(res, 201, "Reviewer deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


