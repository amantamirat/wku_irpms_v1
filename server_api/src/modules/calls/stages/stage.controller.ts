import { Request, Response } from 'express';
import { StageService } from './stage.service';
import { CreateStageDTO, FilterStageDTO, UpdateStageDTO } from './stage.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';


export class StageController {

    private service: StageService;

    constructor(service?: StageService) {
        this.service = service || new StageService();
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
            const { id } = req.params;
            const { name, evaluation, deadline, status } = req.body;

            const dto: UpdateStageDTO = {
                id,
                data: {
                    name,
                    evaluation: evaluation ? (evaluation as string) : undefined,
                    deadline,
                    status,
                },
            };

            const updated = await this.service.updateStage(dto);
            successResponse(res, 200, 'Stage updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    changeStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const dto: UpdateStageDTO = {
                id,
                data: { status },
                //userId: userId,
            };
            const updated = await this.service.changeStatus(dto);
            successResponse(res, 200, "Stage status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;

            const deleted = await this.service.deleteStage(id);
            successResponse(res, 200, 'Stage deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
