// organization.controller.ts
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../common/helpers/response";
import {
    CreateOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { OrganizationService } from "./organization.service";
import { AuthenticatedRequest } from "../auth/auth.middleware";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { Unit } from "../../common/constants/enums";

export class OrganizationController {

    private service: OrganizationService;

    constructor(service: OrganizationService) {
        this.service = service;
    }

    // ----------------------------------------------------
    // CREATE
    // ----------------------------------------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const dto: CreateOrganizationDTO = {
                type: req.body.type,
                name: req.body.name,
                parent: req.body.parent,
                academicLevel: req.body.academicLevel,
                classification: req.body.classification,
                ownership: req.body.ownership,
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, "Organization created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ----------------------------------------------------
    // GET ALL (filter: type, parent)
    // ----------------------------------------------------
    getAll = async (req: Request, res: Response) => {
        try {
            const { type, parent, populate } = req.query;
            const filters: GetOrganizationsDTO = {
                type: type as Unit,
                parent: parent as string,
                ...(populate !== undefined && { populate: populate === "true" })
            };
            const organizations = await this.service.getAll(filters);
            successResponse(res, 200, "Organizations fetched successfully", organizations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const organization = await this.service.getById(id);
            successResponse(res, 200, 'Organization fetched successfully', organization);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ----------------------------------------------------
    // UPDATE
    // ----------------------------------------------------
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            if (!id)
                throw new Error("id not found!");

            const dto: UpdateOrganizationDTO = {
                id,
                data: {
                    name: req.body.name,
                    parent: req.body.parent,
                    academicLevel: req.body.academicLevel,
                    classification: req.body.classification,
                    ownership: req.body.ownership,
                },
                userId: req.user.applicantId,
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Organization updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ----------------------------------------------------
    // DELETE
    // ----------------------------------------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Organization deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
