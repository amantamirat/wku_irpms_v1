import { Request, Response } from 'express';
import { CollaboratorService, CreateCollaboratorDto, GetCollaboratorOptions } from './collaborator.service';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../../util/response';
import { CollaboratorStatus } from './collaborator.enum';

export class CollaboratorController {

    static async createCollaborator(req: Request, res: Response) {
        try {
            const { project, applicant, isLeadPI } = req.body;
            const data: CreateCollaboratorDto = {
                applicant: new mongoose.Types.ObjectId(applicant as string),
                project: new mongoose.Types.ObjectId(project as string),
                isLeadPI: isLeadPI ? true : undefined
            };
            const created = await CollaboratorService.createCollaborator(data);
            successResponse(res, 201, "Collaborator created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCollaborators(req: Request, res: Response) {
        try {
            const { project, applicant } = req.query;
            const filter: GetCollaboratorOptions = {
                project: project ? new mongoose.Types.ObjectId(project as string) : undefined,
                applicant: applicant ? new mongoose.Types.ObjectId(applicant as string) : undefined
            };
            const collaborators = await CollaboratorService.getCollaborators(filter);
            successResponse(res, 200, 'Collaborators fetched successfully', collaborators);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateCollaborator(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { isLeadPI, status } = req.body;
            const data: Partial<CreateCollaboratorDto> = {
                isLeadPI: isLeadPI ? true : undefined,
                status: status as CollaboratorStatus
            };
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


