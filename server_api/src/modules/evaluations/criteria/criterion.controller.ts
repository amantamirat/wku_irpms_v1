import { Request, Response } from "express";
import mongoose from "mongoose";
import { CriterionService } from "./criterion.service";
import { CreateCriterionDTO, GetCriteriaDTO, ImportCriteriaBatchDTO, UpdateCriterionDTO } from "./criterion.dto";
import { successResponse, errorResponse } from "../../../util/response";
import { AuthenticatedRequest } from "../../users/user.middleware";

export class CriterionController {
    static async createCriterion(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { evaluation, title, form_type, weight } = req.body;

            const dto: CreateCriterionDTO = {
                evaluation: new mongoose.Types.ObjectId(evaluation as string),
                title,
                form_type,
                weight: weight,
                //userId: req.user._id
            };

            const criterion = await CriterionService.createCriterion(dto);
            successResponse(res, 201, "Criterion created successfully", criterion);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCriteria(req: Request, res: Response) {
        try {
            const { evaluation, stage, reviewer } = req.query;

            const dto: GetCriteriaDTO = {
                evaluation: evaluation ? new mongoose.Types.ObjectId(evaluation as string) : undefined,
                stage: stage ? new mongoose.Types.ObjectId(stage as string) : undefined,
                reviewer: reviewer ? String(reviewer) : undefined
            };

            const criteria = await CriterionService.getCriteria(
                dto
            );

            successResponse(res, 200, "Criteria fetched successfully", criteria);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateCriterion(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { id } = req.params;
            const { title, form_type, weight } = req.body;

            const dto: UpdateCriterionDTO = {
                id,
                data: { title, form_type, weight }
            };

            const updated = await CriterionService.updateCriterion(dto);
            successResponse(res, 200, "Criterion updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteCriterion(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { id } = req.params;
            const deleted = await CriterionService.deleteCriterion({ id });

            successResponse(res, 200, "Criterion deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async importCriteriaBatch(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { evaluationId, criteriaData } = req.body;
            if (!evaluationId || !Array.isArray(criteriaData)) {
                return errorResponse(res, 400, "evaluationId and criteriaData are required");
            }

            const dto: ImportCriteriaBatchDTO = {
                evaluation: new mongoose.Types.ObjectId(evaluationId as string),
                criteriaData
            };

            const result = await CriterionService.importCriteriaBatch(dto);
            successResponse(res, 201, "Criteria imported successfully", result);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
