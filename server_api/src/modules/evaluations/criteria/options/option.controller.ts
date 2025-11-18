import { Request, Response } from "express";
import mongoose from "mongoose";
import { OptionService } from "./option.service";
import { CreateOptionDTO, GetOptionsDTO, UpdateOptionDTO, DeleteOptionDTO } from "./option.dto";
import { successResponse, errorResponse } from "../../../../util/response";
import { AuthenticatedRequest } from "../../../users/auth/auth.middleware";

export class OptionController {
    static async createOption(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { criterion, title, score } = req.body;

            const dto: CreateOptionDTO = {
                criterion: new mongoose.Types.ObjectId(criterion as string),
                title,
                score: score
            };

            const option = await OptionService.createOption(dto);
            successResponse(res, 201, "Option created successfully", option);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getOptions(req: Request, res: Response) {
        try {
            const { criterion } = req.query;

            const dto: GetOptionsDTO = {
                criterion: new mongoose.Types.ObjectId(criterion as string)
            };

            const options = await OptionService.getOptions(dto);
            successResponse(res, 200, "Options fetched successfully", options);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateOption(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { id } = req.params;
            const { title, score } = req.body;

            const dto: UpdateOptionDTO = {
                id,
                updates: { title, score }
            };

            const updated = await OptionService.updateOption(dto);
            successResponse(res, 200, "Option updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteOption(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found");

            const { id } = req.params;
            const dto: DeleteOptionDTO = { id };

            const deleted = await OptionService.deleteOption(dto);
            successResponse(res, 200, "Option deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
