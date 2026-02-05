import { Request, Response } from "express";
import { errorResponse, successResponse } from '../../../../common/helpers/response';
import { GetCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { CompositionService } from "./composition.service";

const service = new CompositionService();
export class CompositionController {
    static async createComposition(req: Request, res: Response) {
        try {
            const { constraint, value, max, min, item } = req.body;
            const data = {
                constraint: constraint as string,
                value,
                max,
                min,
                item
            };
            const created = await service.createComposition(data);
            successResponse(res, 201, "Composition created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCompositions(req: Request, res: Response) {
        try {
            const { constraint } = req.query;
            if (!constraint) {
                throw new Error("constraint required");
            }
            const options: GetCompositionDTO = {
                constraint: constraint as string
            };
            const compositions = await service.getCompositions(options);
            successResponse(res, 200, 'Compositions fetched successfully', compositions);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateComposition(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { value, max, min, item } = req.body;
            const dto: UpdateCompositionDTO = {
                id: id,
                data: {
                    value: value ?? undefined,
                    max: max ?? undefined,
                    min: min ?? undefined,
                    item: item ?? undefined,
                }
            };
            const updated = await service.updateComposition(dto);
            successResponse(res, 201, "Composition updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteComposition(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await service.deleteComposition(id);
            successResponse(res, 201, "Composition deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
