import { Request, Response } from "express";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../../../../util/response";
import { CreateResultDto, GetResultOptions, ResultService } from "./result.service";

export class ResultController {
    static async createResult(req: Request, res: Response) {
        try {
            const { evaluator, criterion, score, selected_option } = req.body;
            const data: CreateResultDto = {
                evaluator: new mongoose.Types.ObjectId(evaluator as string),
                criterion: new mongoose.Types.ObjectId(criterion as string),
                score: score,
                selected_option: selected_option ? new mongoose.Types.ObjectId(selected_option as string) : undefined
            };
            const created = await ResultService.createResult(data);
            successResponse(res, 201, "Result created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getResults(req: Request, res: Response) {
        try {
            const { evaluator, criterion } = req.query;
            const filter: GetResultOptions = {
                evaluator: evaluator ? String(evaluator) : undefined,
                criterion: criterion ? String(criterion) : undefined
            };
            const results = await ResultService.getResults(filter);
            successResponse(res, 200, "Results fetched successfully", results);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateResult(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { score, selected_option } = req.body;
            const data: Partial<CreateResultDto> = {
                score: score ?? undefined,
                selected_option: selected_option ?? undefined
            };
            const updated = await ResultService.updateResult(id, data);
            successResponse(res, 200, "Result updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteResult(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ResultService.deleteResult(id);
            successResponse(res, 200, "Result deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
