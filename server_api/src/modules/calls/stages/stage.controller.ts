import { Request, Response } from 'express';
import { StageService } from './stage.service';
import { CreateStageDTO, GetStageDTO, UpdateStageDTO, UpdateStageStatusDTO } from './stage.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/auth/auth.middleware';


export class StageController {

    private readonly service: StageService;

    constructor(service: StageService) {
        this.service = service;
    }

    create = async (req: Request, res: Response) => {
        try {
            const { call, name, evaluation, deadline } = req.body;

            const dto: CreateStageDTO = {
                call: call as string,
                name,
                evaluation: evaluation as string,
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
            const { call, status, order } = req.query;

            const dto: GetStageDTO = {
                call: call as string,
                status: status as any,
                order: order ? Number(order) : undefined,
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
            const { id } = req.query;
            const { name, deadline } = req.body;
            const dto: UpdateStageDTO = {
                id: id as string,
                data: {
                    name,
                    //evaluation: evaluation ? (evaluation as string) : undefined,
                    deadline
                },
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Stage updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    updateStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const dto: UpdateStageStatusDTO = {
                id: String(id),
                status
            };
            const updated = await this.service.updateStatus(dto);
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
