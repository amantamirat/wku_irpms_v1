// organization.controller.ts
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../common/helpers/response";
import {
    CreateOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { OrganizationService } from "./organization.service";
import { AuthenticatedRequest } from "../users/user.middleware";
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
                throw new Error(ERROR_CODES.USER_NOT_FOUND);

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
            const filters: GetOrganizationsDTO = {
                type: req.query.type as Unit,
                parent: req.query.parent as string,
            };

            const organizations = await this.service.getAll(filters);
            successResponse(res, 200, "Organizations fetched successfully", organizations);
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
                throw new Error(ERROR_CODES.USER_NOT_FOUND);

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
                userId: req.user.userId,
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
