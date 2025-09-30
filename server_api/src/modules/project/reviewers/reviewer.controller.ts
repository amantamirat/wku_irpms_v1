import { Request, Response } from 'express';
import { ReviewerService, CreateReviewerDto, GetReviewerOptions } from './reviewer.service';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../../util/response';

export class ReviewerController {

    static async createReviewer(req: Request, res: Response) {
        try {
            const { projectStage, applicant } = req.body;
            const data: CreateReviewerDto = {
                applicant: new mongoose.Types.ObjectId(applicant as string),
                project: new mongoose.Types.ObjectId(projectStage as string)
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
                applicant: new mongoose.Types.ObjectId(applicant as string),
                projectStage: new mongoose.Types.ObjectId(projectStage as string)
            };
            const reviewers = await ReviewerService.getReviewers(filter);
            successResponse(res, 200, 'Reviewers fetched successfully', reviewers);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateReviewer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { projectStage, applicant } = req.body;
            const data: CreateReviewerDto = {
                applicant: new mongoose.Types.ObjectId(applicant as string),
                project: new mongoose.Types.ObjectId(projectStage as string)
            };
            const updated = await ReviewerService.updateReviewer(id, data);
            successResponse(res, 201, "Reviewer updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteReviewer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ReviewerService.deleteReviewer(id);
            successResponse(res, 201, "Reviewer deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


