import { Request, Response } from 'express';
import { CollaboratorService, CreateCollaboratorDto, GetCollaboratorsOptions } from './collaborator.service';
import { Types } from 'mongoose';
import { errorResponse, successResponse } from '../../../util/response';

export class CollaboratorController {

    static async createCollaborator(req: Request, res: Response) {
        try {
            const data: CreateCollaboratorDto = req.body;
            const theme = await CollaboratorService.createCollaborator(data);
            successResponse(res, 201, "Collaborator created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCollaborators(req: Request, res: Response) {
        try {
            const { project } = req.query;
            const filter = {
                calendar: project ? new Types.ObjectId(project as string) : undefined
            } as GetCollaboratorsOptions;
            const collaborators = await CollaboratorService.getCollaborators(filter);
            successResponse(res, 200, 'Collaborators fetched successfully', collaborators);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateCollaborator(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreateCollaboratorDto> = req.body;
            const updated = await CollaboratorService.updateCollaborator(id, data);
            successResponse(res, 201, "Collaborator updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteCollaborator(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await CollaboratorService.deleteCollaborator(id);
            successResponse(res, 201, "Collaborator deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


