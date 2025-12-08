import { Request, Response } from "express";
import mongoose from "mongoose";
import { EvaluationService } from "./evaluation.service";
import { errorResponse, successResponse } from "../../util/response";
import { AuthenticatedRequest } from "../users/user.middleware";
import { CreateEvaluationDTO, UpdateEvaluationDTO } from "./evaluation.dto";

export class EvaluationController {
    static async createEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { title, directorate } = req.body;

            const dto: CreateEvaluationDTO = {
                directorate: new mongoose.Types.ObjectId(directorate as string),
                title: title,
                userId: req.user._id
            }
            const evaluation = await EvaluationService.createEvaluation(dto);

            successResponse(res, 201, "Evaluation created successfully", evaluation);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getEvaluations(req: Request, res: Response) {
        try {
            const { directorate } = req.query;

            const evaluations = await EvaluationService.getEvaluations(
                directorate ? new mongoose.Types.ObjectId(directorate as string) : undefined
            );

            successResponse(res, 200, "Evaluations fetched successfully", evaluations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getUserEvaluations(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const userEvaluations = await EvaluationService.getUserEvaluations(userId);
            successResponse(res, 200, 'Evaluations fetched successfully', userEvaluations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { id } = req.params;
            const { title } = req.body;

            const dto: UpdateEvaluationDTO = {
                id: id,
                data: { title: title },
                userId: req.user._id
            }

            const updated = await EvaluationService.updateEvaluation(dto);
            successResponse(res, 200, "Evaluation updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    static async deleteEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { id } = req.params;
            const deleted = await EvaluationService.deleteEvaluation(id, req.user._id);

            successResponse(res, 200, "Evaluation deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
