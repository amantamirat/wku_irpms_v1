import { Request, Response } from 'express';
import { CallService } from './call.service';
import { CreateCallDTO, UpdateCallDTO } from './call.dto';
import { AuthenticatedRequest } from '../users/user.middleware';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { CallStatus } from './call.status';

export class CallController {

    private service: CallService;

    constructor(service?: CallService) {
        this.service = service || new CallService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const data: CreateCallDTO = req.body;
            const call = await this.service.create(data);
            successResponse(res, 201, "Call created successfully", call);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: Request, res: Response) => {
        try {
            const { directorate } = req.query;
            const calls = await this.service.getCalls({ directorate: directorate as string });
            successResponse(res, 200, 'Calls fetched successfully', calls);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.query;
            if (!id) {
                throw new Error("id not found!");
            }
            const { title, description } = req.body;
            const dto: UpdateCallDTO = {
                id: String(id),
                data: { title, description },
                userId: userId,
            };
            const updated = await this.service.update(dto);
            successResponse(res, 200, "Call updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    updateStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.query;
            const { status } = req.params;
            const dto: UpdateCallDTO = {
                id: id as string,
                data: { status: status as CallStatus },
                userId: "",
            };
            const updated = await this.service.updateStatus(dto);
            successResponse(res, 200, "Call status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    /**
     * 
     * changeStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const dto: UpdateCallDTO = {
                id,
                data: { status },
                userId: userId,
            };
            const updated = await this.service.updateStatus(dto);
            successResponse(res, 200, "Call status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }     
     */

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { id } = req.params;
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const deleted = await this.service.delete({ id: id, userId: userId });
            successResponse(res, 200, "Call deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
