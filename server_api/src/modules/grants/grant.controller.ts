import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../users/user.middleware';
import { CreateGrantDTO, GetGrantsDTO, UpdateGrantDTO } from './grant.dto';
import { GrantService } from './grant.service';

const grantService = new GrantService();
export class GrantController {

    static async createGrant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { directorate, title, description } = req.body;
            const dto: CreateGrantDTO = {
                directorateId: directorate as string,
                title: title,
                description: description ?? undefined,
                userId: userId
            };
            const grant = await grantService.createGrant(dto);
            successResponse(res, 201, "Grant created successfully", grant);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getGrants(req: Request, res: Response) {
        try {
            const { directorate } = req.query;
            const filter = {
                directorateId: directorate
            } as GetGrantsDTO;
            const grants = await grantService.getGrants(filter);
            successResponse(res, 200, 'Grants fetched successfully', grants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    /*
    static async getUserGrants(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const grants = await GrantService.getUserGrants(userId);
            successResponse(res, 200, 'Grants fetched successfully', grants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
        */

    static async updateGrant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const { title, description } = req.body;
            const dto: UpdateGrantDTO = {
                id,
                data: { title, description },
                userId: userId,
            };
            const updated = await grantService.updateGrant(dto);
            successResponse(res, 201, "Grant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteGrant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const deleted = await grantService.deleteGrant({ id: id, userId: userId });
            successResponse(res, 201, "Grant deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


