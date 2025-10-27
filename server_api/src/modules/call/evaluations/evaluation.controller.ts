import { Request, Response } from "express";
import mongoose from "mongoose";
import { EvaluationService, CreateEvaluationDto, GetEvalsOptions } from "./evaluation.service";
import { EvaluationType } from "./evaluation.enum";
import { errorResponse, successResponse } from "../../../util/response";
import { AuthenticatedRequest } from "../../users/auth/auth.middleware";

export class EvaluationController {

    static async createEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { type, title, directorate, parent, form_type, weight_value, isValidation } = req.body;
            const data: CreateEvaluationDto = {
                type: type,
                title: title,
                directorate: type === EvaluationType.evaluation ? new mongoose.Types.ObjectId(directorate as string) : undefined,
                parent: type !== EvaluationType.evaluation ? new mongoose.Types.ObjectId(parent as string) : undefined,
                form_type: type === EvaluationType.criterion ? form_type : undefined,
                weight_value: type === EvaluationType.criterion || type === EvaluationType.option ? weight_value : undefined,
                isValidation: type === EvaluationType.stage && isValidation ? isValidation : undefined
            };
            const evaluation = await EvaluationService.createEvaluation(data, userId);
            successResponse(res, 201, "Evaluation created successfully", evaluation);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getEvaluations(req: Request, res: Response) {
        try {
            const { type, parent, directorate } = req.query;
            const filter = {
                type: type as EvaluationType | undefined,
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined,
                directorate: directorate ? new mongoose.Types.ObjectId(directorate as string) : undefined
            } as GetEvalsOptions;
            const evaluations = await EvaluationService.getEvaluations(filter);
            successResponse(res, 200, 'Evaluations fetched successfully', evaluations);
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
            const evals = await EvaluationService.getUserEvaluations(userId);
            successResponse(res, 200, 'Evaluations fetched successfully', evals);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const { title, form_type, weight_value } = req.body;
            const data: Partial<CreateEvaluationDto> = {
                title: title,
                form_type: form_type,
                weight_value: weight_value
            }
            const updated = await EvaluationService.updateEvaluation(id, data, userId);
            successResponse(res, 201, "Evaluation updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteEvaluation(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const deleted = await EvaluationService.deleteEvaluation(id, userId);
            successResponse(res, 201, "Evaluation deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    static async reorderStageLevel(req: Request, res: Response) {
        try {
            const { id, direction } = req.params;
            const data = await EvaluationService.reorderStage(id, direction as 'up' | 'down');
            successResponse(res, 201, "Stage reorder successfully", data);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    /**
     * Batch import criteria (with options) under a given stage
     * Expects: { stageId: string, criteriaData: Array<{ title, weight_value, form_type, options? }> }
     */
    static async importCriteriaBatch(req: Request, res: Response) {
        try {
            const { stageId, criteriaData } = req.body;
            if (!stageId || !Array.isArray(criteriaData)) {
                return errorResponse(res, 400, "stageId and criteriaData are required");
            }
            const result = await EvaluationService.importCriteriaBatch(new mongoose.Types.ObjectId(stageId as string), criteriaData);
            successResponse(res, 201, "Criteria imported successfully", result);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
