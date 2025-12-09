import { Request, Response } from 'express';
import { ThematicService } from './thematic.service';
import { CreateThematicDTO, UpdateThematicDTO } from './thematic.dto';
import { AuthenticatedRequest } from '../users/user.middleware';
import { successResponse, errorResponse } from '../../common/helpers/response';

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
            const thematics = await this.service.getThematics({});
            successResponse(res, 200, 'Thematics fetched successfully', thematics);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { title, description } = req.body;
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const dto: UpdateThematicDTO = {
                id,
                data: { title, description },
                userId: userId,
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, "Thematic updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const deleted = await this.service.delete({ id: id, userId: userId });
            successResponse(res, 200, "Thematic deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
