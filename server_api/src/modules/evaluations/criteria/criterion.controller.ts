import { Request, Response } from 'express';
import fs from "fs";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/auth/auth.middleware";
import {
    CreateCriterionDTO,
    GetCriteriaDTO,
    ImportCriteriaBatchDTO,
    UpdateCriterionDTO
} from "./criterion.dto";
import { CriterionService } from "./criterion.service";

export class CriterionController {

    constructor(private readonly service: CriterionService) { }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            // ✅ Extract options, order, and isRequired from body
            const { evaluation, title, formType, weight, options, order, isRequired } = req.body;

            const dto: CreateCriterionDTO = {
                evaluation,
                title,
                formType,
                weight,
                options, // Merged options handled here
                order,
                isRequired
            };

            const criterion = await this.service.create(dto);
            successResponse(res, 201, "Criterion created successfully", criterion);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    getAll = async (req: Request, res: Response) => {
        try {
            const { evaluation, populate } = req.query;

            const dto: GetCriteriaDTO = {
                evaluation: evaluation as string | undefined,
                populate: populate === 'true'
            };

            const criteria = await this.service.get(dto);
            successResponse(res, 200, "Criteria fetched successfully", criteria);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            // ✅ Allow updating the merged options array directly
            const { title, formType, weight, options, order, isRequired } = req.body;

            const dto: UpdateCriterionDTO = {
                id,
                data: { title, formType, weight, options, order, isRequired }
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Criterion updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Criterion deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // criterion.controller.ts

    importFile = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { evaluationId } = req.body;
            const file = req.file; // Populated by multer

            if (!file) {
                return errorResponse(res, 400, "No file uploaded");
            }

            const result = await this.service.importFromFile(file, evaluationId);

            successResponse(res, 201, "File imported successfully", result);
        } catch (err: any) {
            // If error occurs, check if file exists and delete it
            if (req.file) fs.unlinkSync(req.file.path);
            errorResponse(res, 400, err.message, err);
        }
    }

    import = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { criteriaData } = req.body;

            if (!Array.isArray(criteriaData)) {
                return errorResponse(res, 400, "criteriaData (array) are required");
            }

            // ✅ Pass as a single DTO object to match the Service signature
            const dto: ImportCriteriaBatchDTO = {
                evaluation: id,
                criteriaData
            };

            const result = await this.service.import(dto);

            return successResponse(res, 201, "Criteria batch imported successfully", result);
        } catch (err: any) {
            return errorResponse(res, 400, err.message, err);
        }
    };
}