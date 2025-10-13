import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { CallService, CreateCallDto, GetCallsOptions } from './call.service';
import mongoose from 'mongoose';
import { CallStatus } from './call.enum';


export class CallController {

    static async createCall(req: Request, res: Response) {
        try {
            const { calendar, directorate, title, deadline, description, grant, theme, evaluation } = req.body;
            const data: CreateCallDto = {
                calendar: new mongoose.Types.ObjectId(calendar as string),
                directorate: new mongoose.Types.ObjectId(directorate as string),
                title: title,
                deadline: deadline,
                description: description ?? undefined,
                grant: new mongoose.Types.ObjectId(grant as string),
                theme: new mongoose.Types.ObjectId(theme as string),
                evaluation: new mongoose.Types.ObjectId(evaluation as string)
            };
            const created = await CallService.createCall(data);
            successResponse(res, 201, "Call created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCalls(req: Request, res: Response) {
        try {
            const { calendar, directorate, status } = req.query;
            const filter = {
                calendar: calendar ? new mongoose.Types.ObjectId(calendar as string) : undefined,
                directorate: directorate ? new mongoose.Types.ObjectId(directorate as string) : undefined,
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
            const { calendar, title, deadline, description, grant, theme, evaluation, status } = req.body;
            const { id } = req.params;
            const data: Partial<CreateCallDto> = {
                //calendar: new mongoose.Types.ObjectId(calendar as string),
                title: title,
                deadline: deadline,
                description: description ?? undefined,
                //grant: new mongoose.Types.ObjectId(grant as string),
                //theme: new mongoose.Types.ObjectId(theme as string),
                //evaluation: new mongoose.Types.ObjectId(evaluation as string),
                status: status as CallStatus
            };
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


