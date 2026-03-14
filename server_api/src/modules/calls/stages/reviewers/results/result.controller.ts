import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../../../common/helpers/response";
import { ResultService } from "./result.service";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO} from "./result.dto";
import { AuthenticatedRequest } from "../../../../users/auth/auth.middleware";
import { DeleteDto } from "../../../../../common/dtos/delete.dto";

const resultService = new ResultService();

export class ResultController {

    static async createResult(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { reviewer, criterion, score, selectedOption, comment } = req.body;
            // Map to DTO with *Id properties
            const data: CreateResultDTO = {
                reviewer: reviewer,
                criterion: criterion,
                score,
                selectedOption: selectedOption,
                comment,
                applicantId: req.user.applicantId,
            };

            const created = await resultService.create(data);
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
                reviewer: String(reviewer)
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
                    selectedOption: selectedOption ?? undefined,
                    comment: comment ?? undefined
                },
                applicantId: req.user.applicantId
            };

            const updated = await resultService.update(dto);
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
                applicantId: req.user.applicantId
            };

            const deleted = await resultService.delete(dto);
            successResponse(res, 200, "Result deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
