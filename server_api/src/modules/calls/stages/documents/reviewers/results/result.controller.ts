import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../../../common/helpers/response";
import { ResultService } from "./result.service";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO, DeleteResultDTO } from "./result.dto";
import { AuthenticatedRequest } from "../../../../../users/user.middleware";

const resultService = new ResultService();

export class ResultController {

    static async createResult(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { reviewer, criterion, score, selectedOption, comment } = req.body;

            // Map to DTO with *Id properties
            const data: CreateResultDTO = {
                reviewerId: reviewer,
                criterionId: criterion,
                score,
                selectedOptionId: selectedOption,
                userId: req.user.userId,
                comment
            };

            const created = await resultService.createResult(data);
            successResponse(res, 201, "Result created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getResults(req: Request, res: Response) {
        try {
            const { reviewer } = req.query;
            if (!reviewer) throw new Error("reviewer is required");

            const filter: GetResultsDTO = {
                reviewerId: String(reviewer)
            };

            const results = await resultService.getResults(filter);
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
                id,
                data: {
                    score: score ?? undefined,
                    selectedOptionId: selectedOption ?? undefined,
                    comment: comment ?? undefined
                },
                userId: req.user.userId
            };

            const updated = await resultService.updateResult(dto);
            successResponse(res, 200, "Result updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteResult(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { id } = req.params;

            const dto: DeleteResultDTO = {
                id,
                userId: req.user.userId
            };

            const deleted = await resultService.deleteResult(dto);
            successResponse(res, 200, "Result deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
