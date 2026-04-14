import { Request, Response } from 'express';
import { CallService } from './call.service';
import { CreateCallDTO, UpdateCallDTO } from './call.dto';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { CallStatus } from './call.status';
import { TransitionRequestDto } from '../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../common/errors/error.codes';

export class CallController {

    constructor(private readonly service: CallService) { }

    create = async (req: Request, res: Response) => {
        try {
            const { grantAllocation, title, description } = req.body;
            const dto: CreateCallDTO = { grantAllocation, title, description };
            const call = await this.service.create(dto);
            successResponse(res, 201, "Call created successfully", call);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: Request, res: Response) => {
        try {
            const { grantAllocation, calendar, grant, status, populate } = req.query;
            const calls = await this.service.getCalls({
                grantAllocation: grantAllocation as string,
                calendar: calendar as string,
                grant: grant as string,
                status: status as CallStatus,
                ...(populate !== undefined && { populate: populate === "true" })
            });
            successResponse(res, 200, 'Calls fetched successfully', calls);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const populate =
                req.query.populate === 'true' ||
                req.query.populate === '1';
            const call = await this.service.getById(id, populate);
            successResponse(res, 200, 'Call fetched successfully', call);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const userId = req.user.applicantId;
            const { id } = req.params;
            const { title, description } = req.body;
            const dto: UpdateCallDTO = {
                id: String(id),
                data: { title, description },
                userId: userId,
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, "Call updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

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
            successResponse(res, 200, "Call status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const userId = req.user.applicantId;
            const deleted = await this.service.delete({ id: id, applicantId: userId });
            successResponse(res, 200, "Call deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
