import { Request, Response } from 'express';
import { successResponse, errorResponse } from "../../../common/helpers/response";
import { AuthenticatedRequest } from "../../users/auth/auth.middleware";
import { CreateCriterionDTO, GetCriteriaDTO, UpdateCriterionDTO, ImportCriteriaBatchDTO } from "./criterion.dto";
import { CriterionService } from "./criterion.service";

import { ERROR_CODES } from '../../../common/errors/error.codes';

export class CriterionController {

    private service: CriterionService;

    constructor(service?: CriterionService) {
        this.service = service || new CriterionService();
    }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { evaluation, title, formType, weight } = req.body;
            const dto: CreateCriterionDTO = {
                evaluation,
                title,
                formType,
                weight
            };
            const criterion = await this.service.create(dto);
            successResponse(res, 201, "Criterion created successfully", criterion);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    getAll = async (req: Request, res: Response) => {
        try {
            const { evaluation } = req.query;

            const dto: GetCriteriaDTO = {
                evaluation: evaluation as string | undefined
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
            const { title, formType, weight } = req.body;

            const dto: UpdateCriterionDTO = {
                id,
                data: { title, formType, weight }
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

    import = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { evaluationId, criteriaData } = req.body;

            // Validate input
            if (!evaluationId || !Array.isArray(criteriaData)) {
                return errorResponse(
                    res,
                    400,
                    "evaluationId and criteriaData are required"
                );
            }

            // Call service to import criteria
            const result = await this.service.importCriteriaBatch(
                evaluationId,
                criteriaData
            );

            return successResponse(
                res,
                201,
                "Criteria imported successfully",
                result
            );
        } catch (err: any) {
            return errorResponse(res, 400, err.message, err);
        }
    };
}
