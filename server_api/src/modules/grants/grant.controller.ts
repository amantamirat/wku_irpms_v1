import { Request, Response } from 'express';
import { GrantService } from './grant.service';
import { CreateGrantDTO, GetGrantsDTO, UpdateGrantDTO } from './grant.dto';
import { AuthenticatedRequest } from '../users/user.middleware';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { ERROR_CODES } from '../../common/errors/error.codes';

export class GrantController {

    private service: GrantService;

    constructor(service: GrantService) {
        this.service = service;
    }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user)
                throw new Error(ERROR_CODES.USER_NOT_FOUND);

            const userId = req.user.userId;
            const data: CreateGrantDTO = {
                ...req.body,
                userId
            };

            const grant = await this.service.create(data);
            successResponse(res, 201, "Grant created successfully", grant);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: Request, res: Response) => {
        try {
            const { organization } = req.query;

            const options: GetGrantsDTO = {
                organization: organization as string
            };

            const grants = await this.service.getGrants(options);
            successResponse(res, 200, "Grants fetched successfully", grants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }

            const { id } = req.query;
            if (!id) {
                throw new Error("id not found!");
            }

            const userId = req.user.userId;

            const dto: UpdateGrantDTO = {
                id: String(id),
                data: req.body,
                userId
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Grant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Grant deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
