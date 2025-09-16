import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { CallService, CreateCallDto, GetCallsOptions } from './call.service';
import { Types } from 'mongoose';

export class CallController {

    static async createCall(req: Request, res: Response) {
        try {
            const data: CreateCallDto = req.body;
            const theme = await CallService.createCall(data);
            successResponse(res, 201, "Call created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCalls(req: Request, res: Response) {
        try {
            const { calendar, directorate, status } = req.query;
            const filter = {
                calendar: calendar ? new Types.ObjectId(calendar as string) : undefined,
                directorate: directorate ? new Types.ObjectId(directorate as string) : undefined,
                status: status ?? undefined
            } as GetCallsOptions;
            const calls = await CallService.getCalls(filter);
            successResponse(res, 200, 'Calls fetched successfully', calls);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateCall(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreateCallDto> = req.body;
            const updated = await CallService.updateCall(id, data);
            successResponse(res, 201, "Call updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteCall(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await CallService.deleteCall(id);
            successResponse(res, 201, "Call deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


