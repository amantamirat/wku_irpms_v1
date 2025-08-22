import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { GrantService, CreateGrantDto, GetGrantsOptions } from './grant.service';
import { Types } from 'mongoose';

export class GrantController {

    static async createGrant(req: Request, res: Response) {
        try {
            const data: CreateGrantDto = req.body;
            const theme = await GrantService.createGrant(data);
            successResponse(res, 201, "Grant created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getGrants(req: Request, res: Response) {
        try {
            const { directorate } = req.query;
            const filter = {                
                directorate: directorate ? new Types.ObjectId(directorate as string) : undefined
            } as GetGrantsOptions;
            const grants = await GrantService.getGrants(filter);
            successResponse(res, 200, 'Grants fetched successfully', grants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateGrant(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreateGrantDto> = req.body;
            const updated = await GrantService.updateGrant(id, data);
            successResponse(res, 201, "Grant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteGrant(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await GrantService.deleteGrant(id);
            successResponse(res, 201, "Grant deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


