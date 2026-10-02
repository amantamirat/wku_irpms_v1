import { Request, Response } from 'express';
import { TransitionRequestDto } from '../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { CreateCallDTO, UpdateCallDTO } from './call.dto';
import { CallService } from './call.service';
import { buildFilter } from '../../common/utils/filter.utils';


export class CallController {

    constructor(private readonly service: CallService) { }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const dto: CreateCallDTO = req.body;
            const call = await this.service.create(dto, req.auth.userId, req.auth.scope);

            successResponse(res, 201, "Call created successfully", call);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }
            const filter = buildFilter(req.query, [
                'calendar',
                'grant',
                'status',
            ]);

            const calls = await this.service.readCalls(
                filter, req.auth.scope, { populate: true }
            );

            successResponse(
                res,
                200,
                'Calls fetched successfully',
                calls
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    look = async (req: Request, res: Response) => {
        try {
            const filter = buildFilter(req.query, [
                'calendar',
                'grant',
                'status',
            ]);

            const calls = await this.service.lookCalls(
                filter, {populate:true}
            );

            successResponse(
                res,
                200,
                'Calls fetched successfully',
                calls
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const call = await this.service.getById(
                id,
                { populate: true }
            );

            successResponse(
                res,
                200,
                'Call fetched successfully',
                call
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;
            const {
                title,
                description,
                constraint,
                composition
            } = req.body;

            const dto: UpdateCallDTO = {
                id: String(id),
                data: {
                    title,
                    description,
                    constraint,
                    composition
                },
            };

            const updated = await this.service.update(
                dto,
                req.auth.userId, req.auth.scope
            );

            successResponse(
                res,
                200,
                "Call updated successfully",
                updated
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    transitionState = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;
            const { current, next } = req.body;

            const dto: TransitionRequestDto = {
                id: String(id),
                current,
                next
            };

            const updated = await this.service.transitionState(
                dto,
                req.auth.userId, req.auth.scope
            );

            successResponse(
                res,
                200,
                "Call status updated successfully",
                updated
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth) {
                throw new Error(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;

            const deleted = await this.service.delete({
                id,
                userId: req.auth.userId
            });

            successResponse(
                res,
                200,
                "Call deleted successfully",
                deleted
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}