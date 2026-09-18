import { Request, Response } from 'express';
import { StageService } from './stage.service';
import { CreateStageDTO, FilterStageDto, UpdateStageDTO } from './stage.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { ERROR_CODES } from '../../../common/errors/error.codes';
import { TransitionRequestDto } from '../../../common/dtos/transition.dto';


export class StageController {

    constructor(private readonly service: StageService) {
    }

    create = async (req: AuthenticatedRequest, res: Response) => {

        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const {
                call,
                name,
                template,
                evaluation,
                minReviewers,
                maxReviewers,
                deadline,
                minAcceptanceScore,
            } = req.body;

            const dto: CreateStageDTO = {
                call,
                name,
                template,
                evaluation,
                minReviewers,
                maxReviewers,
                deadline,
                minAcceptanceScore,
            };

            const stage = await this.service.create(dto, req.auth.userId);

            successResponse(
                res,
                201,
                "Stage created successfully",
                stage
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const { call, evaluation, order } = req.query;

            const dto: FilterStageDto = {
                call: call as string,
                evaluation: evaluation as string,
                order: order ? Number(order) : undefined,
            };

            const stages = await this.service.get(dto, { populate: true });
            successResponse(res, 200, 'Stages fetched successfully', stages);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    lookup = async (req: Request, res: Response) => {
        try {
            const { call, evaluation, order } = req.query;

            const dto: FilterStageDto = {
                call: call as string,
                evaluation: evaluation as string,
                order: order ? Number(order) : undefined,
            };

            const stages = await this.service.get(dto);
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


    getPrevious = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const previousStage = await this.service.getPreviousStage(id);

            successResponse(
                res,
                200,
                'previous stage fetched',
                previousStage
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    /*
    getNext = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const nextStage = await this.service.findNextStage(id);
            successResponse(res, 200, 'next stage fetched', nextStage);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
*/


    getUpcoming = async (
        req: Request,
        res: Response
    ) => {
        try {
            const stages =
                await this.service.getAvailable({ populate: true });

            successResponse(
                res,
                200,
                "Upcoming stages fetched successfully",
                stages
            );

        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;

            const {
                name,
                template,
                order,
                minReviewers,
                maxReviewers,
                deadline,
                minAcceptanceScore,
            } = req.body;

            const dto: UpdateStageDTO = {
                id,
                data: {
                    ...(name !== undefined && { name }),
                    ...(template !== undefined && { template }),
                    ...(order !== undefined && { order }),
                    ...(minReviewers !== undefined && { minReviewers }),
                    ...(maxReviewers !== undefined && { maxReviewers }),
                    ...(deadline !== undefined && { deadline }),
                    ...(minAcceptanceScore !== undefined && { minAcceptanceScore }),
                },
            };

            const updated = await this.service.update(dto, req.auth.userId);

            successResponse(
                res,
                200,
                "Stage updated successfully",
                updated
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    transitionState = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const { current, next } = req.body;
            const dto: TransitionRequestDto = {
                id: String(id),
                current: current,
                next: next,
                userId: req.auth.userId,
            };
            const updated = await this.service.transitionState(dto, req.auth.userId);
            successResponse(res, 200, "Stage status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const deleted = await this.service.delete(id, req.auth.userId);
            successResponse(res, 200, 'Stage deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
