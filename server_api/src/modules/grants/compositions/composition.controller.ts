import { Request, Response } from 'express';
import { CompositionService } from './composition.service';
import { ERROR_CODES } from '../../../common/errors/error.codes';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';
import { CreateCompositionDTO, GetCompositionDTO, UpdateCompositionDTO } from './composition.dto';


export class CompositionController {

    private service: CompositionService;

    constructor(service: CompositionService) {
        this.service = service;
    }

    // ✅ Create Composition
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user)
                throw new Error(ERROR_CODES.USER_NOT_FOUND);

            const userId = req.user.userId;

            const data: CreateCompositionDTO = {
                ...req.body,
                userId
            };

            const composition = await this.service.create(data);

            successResponse(res, 201, "Composition created successfully", composition);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ✅ Get Compositions
    get = async (req: Request, res: Response) => {
        try {
            const { grant, populate } = req.query;

            const options: GetCompositionDTO = {
                grant: grant as string,
                populate: populate === "true"
            };

            const compositions = await this.service.getCompositions(options);

            successResponse(res, 200, "Compositions fetched successfully", compositions);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ✅ Update Composition
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error(ERROR_CODES.USER_NOT_FOUND);
            }
            const { id } = req.params;

            const userId = req.user.userId;

            const dto: UpdateCompositionDTO = {
                id: String(id),
                data: req.body,
                userId
            };

            const updated = await this.service.update(dto);

            successResponse(res, 200, "Composition updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // ✅ Delete Composition
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Composition deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
