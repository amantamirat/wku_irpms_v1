import { Request, Response } from 'express';

import { CreateOptionDTO, GetOptionsDTO, UpdateOptionDTO } from "./option.dto";
import { OptionService } from "./option.service";
import { successResponse, errorResponse } from '../../../../common/helpers/response';
import { AuthenticatedRequest } from '../../../users/auth/auth.middleware';

export class OptionController {

    private service: OptionService;

    constructor(service?: OptionService) {
        this.service = service || new OptionService();
    }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found");

            const dto: CreateOptionDTO = {
                criterion: req.body.criterion,
                title: req.body.title,
                score: req.body.score
            };

            const option = await this.service.create(dto);
            successResponse(res, 201, "Option created successfully", option);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    getOptions = async (req: Request, res: Response) => {
        try {
            const options = await this.service.getOptions({ criterion: req.query.criterion as string });
            successResponse(res, 200, "Options fetched successfully", options);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found");

            const dto: UpdateOptionDTO = {
                id: req.params.id,
                data: {
                    title: req.body.title,
                    score: req.body.score
                },
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, "Option updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error("User not found");

            const deleted = await this.service.delete({
                id: req.params.id,
                applicantId: req.user.applicantId
            });

            successResponse(res, 200, "Option deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
