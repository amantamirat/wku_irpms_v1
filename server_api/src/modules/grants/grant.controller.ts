import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { errorResponse, successResponse } from '../../util/response';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { CreateGrantDto, GetGrantsOptions, GrantService } from './grant.service';

export class GrantController {

    static async createGrant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { directorate, title, description } = req.body;
            const data: CreateGrantDto = {
                directorate: new mongoose.Types.ObjectId(directorate as string),
                title: title,
                description: description ?? undefined
            };
            const grant = await GrantService.createGrant(data, userId);
            successResponse(res, 201, "Grant created successfully", grant);
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

    static async updateGrant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const { title, description } = req.body;
            const data: Partial<CreateGrantDto> = {
                title: title,
                description: description ?? undefined
            };
            const updated = await GrantService.updateGrant(id, data, userId);
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
            const deleted = await GrantService.deleteGrant(id, userId);
            successResponse(res, 201, "Grant deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


