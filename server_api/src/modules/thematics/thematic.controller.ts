import { Request, Response } from 'express';
import { ThematicService } from './thematic.service';
import { CreateThematicDTO, UpdateThematicDTO } from './thematic.dto';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { TransitionRequestDto } from '../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { ThematicStatus } from './thematic.state-machine';

export class ThematicController {

    private service: ThematicService;

    constructor(service?: ThematicService) {
        this.service = service || new ThematicService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const data: CreateThematicDTO = req.body;
            const thematic = await this.service.create(data);
            successResponse(res, 201, "Thematic created successfully", thematic);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: Request, res: Response) => {
        try {
            const { status } = req.query;
            const thematics = await this.service.getThematics({
                status: status as ThematicStatus,
            });
            successResponse(res, 200, 'Thematics fetched successfully', thematics);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { title, description } = req.body;
            const dto: UpdateThematicDTO = {
                id,
                data: { title, description }
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, "Thematic updated successfully", updated);
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
            successResponse(res, 200, "Eval status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete({ id: id });
            successResponse(res, 200, "Thematic deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
