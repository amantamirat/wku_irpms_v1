import { Request, Response } from "express";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../../common/helpers/response";
import { CreatePositionDto, GetPositionOptions, PositionService } from "./position.service";
import { PositionType } from "./position.enum";
//import { Scope } from "../applicant.enum";

export class PositionController {
    // 🟢 CREATE
    static async createPosition(req: Request, res: Response) {
        try {
            const { type, name, category, parent } = req.body;

            const data: CreatePositionDto = {
                type: type as PositionType,
                name: name,
                category: type === PositionType.position ? category : undefined,
                parent: type === PositionType.rank && parent
                    ? new mongoose.Types.ObjectId(parent as string)
                    : undefined,
            };

            const created = await PositionService.createPosition(data);
            successResponse(res, 201, "Position created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // 🟡 GET MANY
    static async getPositions(req: Request, res: Response) {
        try {
            const { type, parent } = req.query;

            const filter: GetPositionOptions = {
                type: type ? (type as PositionType) : undefined,
                parent: parent ? String(parent) : undefined,
            };

            const positions = await PositionService.getPositions(filter);
            successResponse(res, 200, "Positions fetched successfully", positions);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // 🟠 UPDATE
    static async updatePosition(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, category, parent, type } = req.body;
            const data: Partial<CreatePositionDto> = {
                name: name ?? undefined,
                category: category ?? undefined,
                parent: parent ? new mongoose.Types.ObjectId(parent as string) : undefined,
                type: type ?? undefined,
            };
            const updated = await PositionService.updatePosition(id, data);
            successResponse(res, 200, "Position updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // 🔴 DELETE
    static async deletePosition(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await PositionService.deletePosition(id);
            successResponse(res, 200, "Position deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
