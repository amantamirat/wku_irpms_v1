import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { ResultService } from "./result.service";
import { CreateResultDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";
import { AuthenticatedRequest } from "../../auth/auth.middleware";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../common/dtos/delete.dto";

export class ResultController {

    constructor(private readonly service: ResultService) {}

    // -----------------------
    // CREATE
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { reviewer, criterion, score, selectedOptions, comment } = req.body;

            const dto: CreateResultDTO = {
                reviewer,
                criterion,
                score,
                selectedOptions,
                comment,
                applicantId: req.auth.userId,
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, "Result created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // GET
    // -----------------------
    get = async (req: Request, res: Response) => {
        try {
            const { reviewer } = req.query;

            const filter: GetResultsDTO = {
                reviewer: String(reviewer)
            };

            const results = await this.service.getResults(filter);
            successResponse(res, 200, "Results fetched successfully", results);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // UPDATE
    // -----------------------
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const { score, selectedOptions, comment } = req.body;

            const dto: UpdateResultDTO = {
                id: String(id),
                data: {
                    ...(score !== undefined && { score }),
                    ...(selectedOptions !== undefined && { selectedOptions }),
                    ...(comment !== undefined && { comment })
                },
                applicantId: req.auth.userId
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Result updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // DELETE
    // -----------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;

            const dto: DeleteDto = {
                id: String(id),
                applicantId: req.auth.userId
            };

            const deleted = await this.service.delete(dto);
            successResponse(res, 200, "Result deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}