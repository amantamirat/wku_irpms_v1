import { Request, Response } from "express";
import { Types } from "mongoose";
import { OrganizationService, CreateOrganizationDto, GetOrganizationsOptions } from "./organization.service";

import { errorResponse, successResponse } from "../../util/response";
import { Unit } from "./organization.enum";



export class OrganizationController {

    static async createOrganization(req: Request, res: Response) {
        try {
            const data: CreateOrganizationDto = req.body;
            const organization = await OrganizationService.createOrganization(data);
            successResponse(res, 201, "Organization created successfully", organization);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
    
    static async getOrganizations(req: Request, res: Response) {
        try {
            const { type, parent } = req.query;
            const filter = {
                type: type as Unit | undefined,
                parent: parent ? new Types.ObjectId(parent as string) : undefined
            } as GetOrganizationsOptions;
            const organizations = await OrganizationService.getOrganizations(filter);
            successResponse(res, 200, 'Organizations fetched successfully', organizations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreateOrganizationDto> = req.body;
            const updated = await OrganizationService.updateOrganization(id, data);
            successResponse(res, 201, "Organization updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteOrganization(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await OrganizationService.deleteOrganization(id);
            successResponse(res, 201, "Organization deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
