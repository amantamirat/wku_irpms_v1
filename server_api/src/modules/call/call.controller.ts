import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../util/response';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { CallService } from './call.service';
import { CallStatus } from './call.enum';
import { CreateCallDto, GetCallsOptions } from './call.dto';

export class CallController {

    static async createCall(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { calendar, directorate, title, description, grant, theme, evaluation } = req.body;
            const data: CreateCallDto = {
                calendar: new mongoose.Types.ObjectId(calendar as string),
                directorate: new mongoose.Types.ObjectId(directorate as string),
                title,
                //deadline,
                description: description ?? undefined,
                grant: new mongoose.Types.ObjectId(grant as string),
                theme: new mongoose.Types.ObjectId(theme as string),
                evaluation: new mongoose.Types.ObjectId(evaluation as string)
            };

            const created = await CallService.createCall(data, req.user._id);
            successResponse(res, 201, "Call created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCalls(req: Request, res: Response) {
        try {
            const { calendar, directorate, status } = req.query;
            const filter: GetCallsOptions = {
                calendar: calendar ? new mongoose.Types.ObjectId(calendar as string) : undefined,
                directorate: directorate ? new mongoose.Types.ObjectId(directorate as string) : undefined,
                status: status as CallStatus ?? undefined
            };
            const calls = await CallService.getCalls(filter);
            successResponse(res, 200, 'Calls fetched successfully', calls);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getUserCalls(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const calls = await CallService.getUserCalls(userId);
            successResponse(res, 200, 'User calls fetched successfully', calls);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateCall(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { id } = req.params;
            const { title, deadline, description, status } = req.body;

            const data: Partial<CreateCallDto> = {
                title,
                description: description ?? undefined,
                status: status as CallStatus
            };

            const updated = await CallService.updateCall(id, data, req.user._id);
            successResponse(res, 201, "Call updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteCall(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const { id } = req.params;
            const deleted = await CallService.deleteCall(id, req.user._id);
            successResponse(res, 201, "Call deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
