import { Request, Response } from "express";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../../../../util/response";
import { ResultService } from "./result.service";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { AuthenticatedRequest } from "../../../../users/auth/auth.middleware";
import { DeleteDto } from "../../../../../util/delete.dto";

export class ResultController {

    static async createResult(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { reviewer, criterion, score, selectedOption, comment } = req.body;

            const data: CreateResultDTO = {
                reviewer: new mongoose.Types.ObjectId(reviewer as string),
                criterion: new mongoose.Types.ObjectId(criterion as string),
                score: score,
                selectedOption: selectedOption ? new mongoose.Types.ObjectId(selectedOption as string) : undefined,
                userId: req.user._id,
                comment: comment
            };
            const created = await ResultService.createResult(data);
            successResponse(res, 201, "Result created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getResults(req: Request, res: Response) {
        try {
            const { reviewer } = req.query;
            const filter: GetResultsDTO = {
                reviewer: reviewer ? new mongoose.Types.ObjectId(String(reviewer)) : undefined,
            };
            const results = await ResultService.getResults(filter);
            successResponse(res, 200, "Results fetched successfully", results);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateResult(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { id } = req.params;
            const { score, selectedOption, comment } = req.body;
            const dto: UpdateResultDTO = {
                id: id,
                data: {
                    score: score ?? undefined,
                    selectedOption: selectedOption ? new mongoose.Types.ObjectId(selectedOption as string) : undefined,
                    comment: comment ?? undefined
                },
                userId: req.user._id,
            };
            const updated = await ResultService.updateResult(dto);
            successResponse(res, 200, "Result updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteResult(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { id } = req.params;
            const dto: DeleteDto = {
                id,
                userId: req.user._id
            };
            const deleted = await ResultService.deleteResult(dto);
            successResponse(res, 200, "Result deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
