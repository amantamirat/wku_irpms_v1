import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/user.middleware";
import { CreateEvaluationDTO, GetEvaluationsDTO, UpdateEvaluationDTO } from "./evaluation.dto";
import { EvaluationService } from "./evaluation.service";

const evaluationService = new EvaluationService();

export class EvaluationController {

    static async createEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const userId = req.user._id;
            const { directorate, title } = req.body;

            const dto: CreateEvaluationDTO = {
                directorate: directorate,
                title: title,
                userId: userId
            };

            const evaluation = await evaluationService.createEvaluation(dto);
            successResponse(res, 201, "Evaluation created successfully", evaluation);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getEvaluations(req: Request, res: Response) {
        try {
            const { directorate } = req.query;
            const filter: GetEvaluationsDTO = {
                directorate: directorate as string | undefined
            };

            const evaluations = await evaluationService.getEvaluations(filter);
            successResponse(res, 200, "Evaluations fetched successfully", evaluations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    /*
    static async getUserEvaluations(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");
            const userId = req.user._id;
            const userEvaluations = await EvaluationService.getUserEvaluations(userId);
            successResponse(res, 200, "Evaluations fetched successfully", userEvaluations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
    */

    static async updateEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const userId = req.user._id;
            const { id } = req.params;
            const { title } = req.body;

            const dto: UpdateEvaluationDTO = {
                id,
                data: { title },
                userId: userId
            };

            const updated = await evaluationService.updateEvaluation(dto);
            successResponse(res, 200, "Evaluation updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const userId = req.user._id;
            const { id } = req.params;

            const deleted = await evaluationService.deleteEvaluation({ id, userId });
            successResponse(res, 200, "Evaluation deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}
