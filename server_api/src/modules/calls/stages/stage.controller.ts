import { Request, Response } from 'express';
import { StageService } from './stage.service';
import { CreateStageDTO, FilterStageDTO, UpdateStageDTO } from './stage.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';
import { string } from 'joi';
import { StageStatus } from './stage.enum';


export class StageController {

    private service: StageService;

    constructor(service?: StageService) {
        this.service = service || new StageService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const { call, name, evaluation, deadline, isFinal } = req.body;

            const dto: CreateStageDTO = {
                call: call as string,
                name,
                evaluation: evaluation as string,
                deadline,
                isFinal
            };

            const stage = await this.service.create(dto);
            successResponse(res, 201, 'Stage created successfully', stage);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const { call } = req.query;

            const dto: FilterStageDTO = {
                call: call as string,
            };

            const stages = await this.service.getStages(dto);
            successResponse(res, 200, 'Stages fetched successfully', stages);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.query;
            const { name, deadline, isFinal } = req.body;
            const dto: UpdateStageDTO = {
                id: id as string,
                data: {
                    name,
                    //evaluation: evaluation ? (evaluation as string) : undefined,
                    deadline,
                    isFinal
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
            const { id } = req.query;
            const { status } = req.params;
            const dto: UpdateStageDTO = {
                id: id as string,
                data: { status: status as StageStatus }
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
