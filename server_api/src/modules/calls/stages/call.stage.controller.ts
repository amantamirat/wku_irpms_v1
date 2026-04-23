import { Request, Response } from 'express';
import { StageService } from './call.stage.service';
import { CreateStageDTO, GetStageDTO, UpdateStageDTO } from './call.stage.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { TransitionRequestDto } from '../../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../../common/errors/error.codes';


export class StageController {

    private readonly service: StageService;

    constructor(service: StageService) {
        this.service = service;
    }

    create = async (req: Request, res: Response) => {
        try {
            const { call, grantStage, order, deadline } = req.body;

            const dto: CreateStageDTO = {
                call: call as string,
                grantStage: grantStage as string,
                order,
                deadline,
            };

            const stage = await this.service.create(dto);
            successResponse(res, 201, 'Stage created successfully', stage);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const { call, grantStage, status, populate, order } = req.query;

            const dto: GetStageDTO = {
                ...(call && { call: String(call) }),
                ...(grantStage && { grantStage: String(grantStage) }),
                ...(status && { status: status as any }),
                ...(order !== undefined && { order: Number(order) }),
                ...(populate !== undefined && { populate: populate === "true" })
            };

            const stages = await this.service.getStages(dto);
            successResponse(res, 200, 'Stages fetched successfully', stages);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const stage = await this.service.getById(id);
            successResponse(res, 200, 'stage fetched', stage);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { deadline } = req.body;
            const dto: UpdateStageDTO = {
                id: id as string,
                data: {
                    deadline
                },
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Stage updated successfully', updated);
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
            successResponse(res, 200, "Stage status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, 'Stage deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
