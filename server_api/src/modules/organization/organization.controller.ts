// organization.controller.ts
import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../util/response";

import {
    CreateOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";

import { OrganizationService } from "./organization.service";
import { OrganizationRepository } from "./organization.repository";
import { Unit } from "./organization.enum";
import { AuthenticatedRequest } from "../users/user.middleware";

const service = new OrganizationService(new OrganizationRepository());

export class OrganizationController {

    // ----------------------------------------------------
    // CREATE
    // ----------------------------------------------------
    static async create(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not authorized!");

            const dto: CreateOrganizationDTO = {
                type: req.body.type,
                name: req.body.name,
                parent: req.body.parent,
                academicLevel: req.body.academic_level,
                classification: req.body.classification,
                ownership: req.body.ownership,
            };

            const created = await service.create(dto);

            successResponse(res, 201, "Organization created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // ----------------------------------------------------
    // GET ALL (filter: type, parent)
    // ----------------------------------------------------
    static async getAll(req: Request, res: Response) {
        try {
            const filters: GetOrganizationsDTO = {
                type: req.query.type as Unit,
                parent: req.query.parent as string
            };

            const organizations = await service.getAll(filters);

            successResponse(res, 200, "Organizations fetched successfully", organizations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // ----------------------------------------------------
    // UPDATE
    // ----------------------------------------------------
    static async update(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not authorized!");

            const { id } = req.params;

            const dto: UpdateOrganizationDTO = {
                id,
                data: {
                    name: req.body.name,
                    parent: req.body.parent,
                    academicLevel: req.body.academic_level,
                    classification: req.body.classification,
                    ownership: req.body.ownership,
                },
                userId:req.user._id,
            };

            const updated = await service.update(id, dto);

            successResponse(res, 200, "Organization updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // ----------------------------------------------------
    // DELETE
    // ----------------------------------------------------
    static async delete(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not authorized!");

            const { id } = req.params;

           const deleted =  await service.delete(id);

            successResponse(res, 200, "Organization deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
