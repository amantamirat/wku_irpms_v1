import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/auth/auth.middleware";

import {
    CreateTemplateDTO,
    GetTemplatesDTO,
    UpdateTemplateDTO
} from "./template.dto";

import { TemplateService } from "./template.service";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { TemplateStatus } from "./template.model";

export class TemplateController {

    constructor(private readonly service: TemplateService) { }

    // ---------------- CREATE ----------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const dto: CreateTemplateDTO = {
                name: req.body.name,
                description: req.body.description,
                sections: req.body.sections,
                status: req.body.status // optional
            };

            const template = await this.service.create(dto);
            successResponse(res, 201, "Template created successfully", template);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------- GET ----------------
    getAll = async (req: Request, res: Response) => {
        try {
            const { status, name } = req.query;

            const filter: GetTemplatesDTO = {
                status: status as TemplateStatus,
                name: name as string
            };

            const templates = await this.service.get(filter);
            successResponse(res, 200, "Templates fetched successfully", templates);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------- GET BY ID (optional but useful) ----------------
    getById = async (req: Request, res: Response) => {
        try {
            const template = await this.service["repository"].findById(req.params.id);

            if (!template) {
                throw new Error(ERROR_CODES.TEMPLATE_NOT_FOUND);
            }

            successResponse(res, 200, "Template fetched successfully", template);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------- UPDATE ----------------
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const dto: UpdateTemplateDTO = {
                id: req.params.id,
                data: {
                    name: req.body.name,
                    description: req.body.description,
                    sections: req.body.sections,
                    status: req.body.status
                }
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Template updated successfully", updated);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------- TRANSITION ----------------
    transitionState = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const { current, next } = req.body;

            const dto: TransitionRequestDto = {
                id: String(id),
                current: current,
                next: next,
                applicantId: req.user.applicantId
            };

            const updated = await this.service.transitionState(dto);

            successResponse(res, 200, "Template status updated successfully", updated);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ---------------- DELETE ----------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const deleted = await this.service.delete({
                id: req.params.id,
                applicantId: req.user.applicantId
            });

            successResponse(res, 200, "Template deleted successfully", deleted);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}