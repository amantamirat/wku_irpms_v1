import { Request, Response } from "express";
import { CompositionService } from "./composition.service";
import { errorResponse, successResponse } from '../../../../util/response';
import mongoose from 'mongoose';

export class CompositionController {
    static async createComposition(req: Request, res: Response) {
        try {
            const { parent, value, max, min, item } = req.body;
            if (!parent) throw new Error("Parent is required");
            const data = {
                parent: new mongoose.Types.ObjectId(parent as string),
                value,
                max,
                min,
                item
            };
            const created = await CompositionService.createComposition(data);
            successResponse(res, 201, "Composition created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCompositions(req: Request, res: Response) {
        try {
            const { parent } = req.query;
            const options = {
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined
            };
            const compositions = await CompositionService.getCompositions(options);
            successResponse(res, 200, 'Compositions fetched successfully', compositions);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateComposition(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { value, max, min, item } = req.body;
            const data = {
                value: value ?? undefined,
                max: max ?? undefined,
                min: min ?? undefined,
                item: item ?? undefined,
            };
            const updated = await CompositionService.updateComposition(id, data);
            successResponse(res, 201, "Composition updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteComposition(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await CompositionService.deleteComposition(id);
            successResponse(res, 201, "Composition deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
