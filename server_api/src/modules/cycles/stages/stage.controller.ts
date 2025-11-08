import { Request, Response } from "express";
import mongoose from "mongoose";
import { StageService } from "./stage.service";
import { CreateStageDTO, GetStagesDTO, UpdateStageDTO } from "./stage.dto";
import { successResponse, errorResponse } from "../../../util/response";
import { StageStatus } from "./stage.enum";

export class StageController {
    static async createStage(req: Request, res: Response) {
        try {
            const { cycle, name, type, evaluation, deadline } = req.body;
            const dto: CreateStageDTO = {
                cycle: new mongoose.Types.ObjectId(cycle as string),
                name,
                type,
                evaluation: new mongoose.Types.ObjectId(evaluation as string),
                deadline,
                //status: StageStatus.planned
            };

            const stage = await StageService.createStage(dto);
            successResponse(res, 201, "Stage created successfully", stage);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getStages(req: Request, res: Response) {
        try {
            const { cycle, order, status } = req.query;

            const dto: GetStagesDTO = {
                cycle: new mongoose.Types.ObjectId(cycle as string),
                order: order ? Number(order) : undefined,
                status: status as StageStatus
            };

            const stages = await StageService.getStages(dto);
            successResponse(res, 200, "Stages fetched successfully", stages);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateStage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, type, evaluation, deadline, status } = req.body;

            const dto: UpdateStageDTO = {
                id,
                data: {
                    name,
                    //type,
                    evaluation: evaluation ? new mongoose.Types.ObjectId(evaluation as string) : undefined,
                    deadline,
                    status,
                },
            };

            const updated = await StageService.updateStage(dto);
            successResponse(res, 200, "Stage updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteStage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await StageService.deleteStage(id);
            successResponse(res, 200, "Stage deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
