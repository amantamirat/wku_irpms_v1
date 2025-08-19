import { Request, Response } from "express";
import { Types } from "mongoose";
import { EvaluationService, CreateEvaluationDto, GetEvalsOptions } from "./evaluation.service";
import { EvalType } from "./enums/eval.type.enum";
import { errorResponse, successResponse } from "../../util/response";

export class EvaluationController {

    static async createEvaluation(req: Request, res: Response) {
        try {
            const data: CreateEvaluationDto = req.body;
            const evaluation = await EvaluationService.createEvaluation(data);
            successResponse(res, 201, "Evaluation created successfully", evaluation);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
    
    static async getEvaluations(req: Request, res: Response) {
        try {
            const { type, parent, directorate } = req.query;
            const filter = {
                type: type as EvalType | undefined,
                parent: parent ? new Types.ObjectId(parent as string) : undefined,
                directorate: directorate ? new Types.ObjectId(directorate as string) : undefined
            } as GetEvalsOptions;
            const evaluations = await EvaluationService.getEvaluations(filter);
            successResponse(res, 200, 'Evaluations fetched successfully', evaluations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateEvaluation(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreateEvaluationDto> = req.body;
            const updated = await EvaluationService.updateEvaluation(id, data);
            successResponse(res, 201, "Evaluation updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteEvaluation(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await EvaluationService.deleteEvaluation(id);
            successResponse(res, 201, "Evaluation deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    static async reorderStageLevel(req: Request, res: Response) {
        try {
            const { id, direction } = req.params;            
            const data = await EvaluationService.reorderStageLevel(id, direction);
            successResponse(res, 201, "Stage reorder successfully", data);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
