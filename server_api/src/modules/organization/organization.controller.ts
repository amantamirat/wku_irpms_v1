import { Request, Response } from "express";
import mongoose from "mongoose";
import { OrganizationService, CreateOrganizationDto, GetOrganizationsOptions } from "./organization.service";
import { errorResponse, successResponse } from "../../util/response";
import { Unit } from "./organization.enum";



export class OrganizationController {

    static async createOrganization(req: Request, res: Response) {
        try {
            const { type, name, parent, academic_level, classification, category, ownership } = req.body;
            const data: CreateOrganizationDto = {
                type: type,
                name: name,
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined,
                academic_level: type === Unit.Program || type === Unit.Specialization ? academic_level : undefined,
                classification: type === Unit.Program ? classification : undefined,                
                ownership: type === Unit.External ? ownership : undefined,
            };
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
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined
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
            const { type, name, parent, academic_level, classification, ownership } = req.body;
            const data: Partial<CreateOrganizationDto> = {
                name: name,
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined,
                academic_level: academic_level ? academic_level : undefined,
                classification: classification ? classification : undefined,
                ownership: ownership ? ownership : undefined,
            };
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
