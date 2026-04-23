import { Request, Response } from 'express';
import { GrantService } from './grant.service';
import { CreateGrantDTO, GetGrantsDTO, UpdateGrantDTO } from './grant.dto';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { TransitionRequestDto } from '../../common/dtos/transition.dto';
import { GrantStatus } from './grant.model';

export class GrantController {


    constructor(private readonly service: GrantService) { }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user)
                throw new Error(ERROR_CODES.UNAUTHORIZED);

            const userId = req.user.applicantId;
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
            const { organization, thematic, status, populate } = req.query;
            const options: GetGrantsDTO = {
                organization: organization as string,
                thematic: thematic as string,
                status: status as GrantStatus,
                ...(populate !== undefined && { populate: populate === "true" })
            };
            const grants = await this.service.get(options);
            successResponse(res, 200, "Grants fetched successfully", grants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }



    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const grant = await this.service.getById(id);
            successResponse(res, 200, 'Grant fetched successfully', grant);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { title, description, amount } = req.body;
            const dto: UpdateGrantDTO = {
                id: String(id),
                data: { title, description, amount }
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, "Grant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    transitionState = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const { current, next } = req.body;
            const dto: TransitionRequestDto = {
                id: String(id),
                current: current,
                next: next,
                applicantId: req.user.applicantId,
            };
            const updated = await this.service.transitionState(dto);
            successResponse(res, 200, "Grant status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

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
