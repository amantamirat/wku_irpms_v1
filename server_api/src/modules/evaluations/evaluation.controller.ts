import { Request, Response } from 'express';
import { successResponse, errorResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/auth/auth.middleware";
import { CreateEvaluationDTO, GetEvaluationsDTO, UpdateEvaluationDTO } from "./evaluation.dto";
import { EvaluationService } from "./evaluation.service";
import { ERROR_CODES } from '../../common/errors/error.codes';

export class EvaluationController {

    private service: EvaluationService;

    constructor(service: EvaluationService) {
        this.service = service;
    }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const dto: CreateEvaluationDTO = {
                directorate: req.body.directorate,
                title: req.body.title,
                userId: req.user.applicantId
            };

            const evaluation = await this.service.create(dto);
            successResponse(res, 201, "Evaluation created successfully", evaluation);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    getEvaluations = async (req: Request, res: Response) => {
        try {
            const { directorate } = req.query;
            const filter: GetEvaluationsDTO = {
                directorate: directorate as string
            };

            const evaluations = await this.service.getEvaluations(filter);
            successResponse(res, 200, "Evaluations fetched successfully", evaluations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found");

            const dto: UpdateEvaluationDTO = {
                id: req.params.id,
                data: { title: req.body.title },
                userId: req.user.applicantId
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Evaluation updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found");

            const deleted = await this.service.delete({
                id: req.params.id,
                applicantId: req.user.applicantId
            });

            successResponse(res, 200, "Evaluation deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
