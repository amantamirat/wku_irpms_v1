import { Response } from "express";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../common/helpers/response";
import { AuthenticatedRequest } from "../users/user.middleware";
import { CycleStatus, CycleType } from './cycle.d';
import {
    CreateCycleDto,
    DeleteCycleDto,
    GetCyclesOptions,
    UpdateCycleDto
} from "./cycle.dto";
import { CycleService } from "./cycle.service";

export class CycleController {

    // -----------------------
    // Create (merged)
    // -----------------------
    static async createCycle(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { type, calendar, title, description, grant, theme, organization, status } = req.body;

            const cycleType = type as CycleType;

            const dto: CreateCycleDto = {
                calendar: new mongoose.Types.ObjectId(calendar as string),
                title,
                description: description ?? undefined,
                grant: new mongoose.Types.ObjectId(grant as string),
                theme: theme ? new mongoose.Types.ObjectId(theme as string) : undefined,
                status,
                type: cycleType,
                organization: new mongoose.Types.ObjectId(organization as string),
                userId: req.user._id,
            };
            const created = await CycleService.createCycle(dto);
            successResponse(res, 201, "Cycle created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    // -----------------------
    // Fetch / Query
    // -----------------------
    static async getCycles(req: AuthenticatedRequest, res: Response) {
        try {
            const { calendar, grant, type, status, user } = req.query;

            const filter: GetCyclesOptions = {
                userId: user && req.user ? req.user._id : undefined,
                calendar: calendar ? new mongoose.Types.ObjectId(calendar as string) : undefined,
                grant: grant ? new mongoose.Types.ObjectId(grant as string) : undefined,
                status: status as CycleStatus,
                type: type as CycleType
            };

            const cycles = await CycleService.getCycles(filter);
            successResponse(res, 200, "Cycles fetched successfully", cycles);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // -----------------------
    // Update
    // -----------------------
    static async updateCycle(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;
            const { title, description, status } = req.body;

            const dto: UpdateCycleDto = {
                id,
                data: { title, description, status },
                userId: req.user._id
            };

            const updated = await CycleService.updateCycle(dto);
            successResponse(res, 200, "Cycle updated successfully", updated);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    // -----------------------
    // Delete
    // -----------------------
    static async deleteCycle(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;
            const dto: DeleteCycleDto = {
                id,
                userId: req.user._id
            };

            const deleted = await CycleService.deleteCycle(dto);
            successResponse(res, 200, "Cycle deleted successfully", deleted);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
