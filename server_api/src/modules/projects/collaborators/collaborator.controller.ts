import { Response } from 'express';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../../util/response';
import { AuthenticatedRequest } from '../../users/auth/auth.middleware';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorStatus } from './collaborator.enum';
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
    DeleteCollaboratorDto,
} from './collaborator.dto';

export class CollaboratorController {

    static async createCollaborator(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');

            const { project, applicant, isLeadPI } = req.body;
            const dto: CreateCollaboratorDto = {
                applicant: new mongoose.Types.ObjectId(applicant as string),
                project: new mongoose.Types.ObjectId(project as string),
                isLeadPI: isLeadPI ? true : undefined,
                userId: req.user._id,
            };

            const created = await CollaboratorService.createCollaborator(dto);
            successResponse(res, 201, 'Collaborator created successfully', created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCollaborators(req: AuthenticatedRequest, res: Response) {
        try {
            const { project, applicant, user } = req.query;

            const filter: GetCollaboratorsOptions = {
                project: project ? new mongoose.Types.ObjectId(project as string) : undefined,
                applicant: applicant ? new mongoose.Types.ObjectId(applicant as string) : undefined,
                userId: user && req.user ? req.user._id : undefined,
            };

            const collaborators = await CollaboratorService.getCollaborators(filter);
            successResponse(res, 200, 'Collaborators fetched successfully', collaborators);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateCollaborator(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');

            const { id } = req.params;
            const { isLeadPI, status } = req.body;

            const dto: UpdateCollaboratorDto = {
                id,
                data: {
                    isLeadPI: isLeadPI ? true : undefined,
                    status: status as CollaboratorStatus,
                },
                userId: req.user._id,
            };

            const updated = await CollaboratorService.updateCollaborator(dto);
            successResponse(res, 200, 'Collaborator updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteCollaborator(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');

            const { id } = req.params;
            const dto: DeleteCollaboratorDto = { id, userId: req.user._id };

            const deleted = await CollaboratorService.deleteCollaborator(dto);
            successResponse(res, 200, 'Collaborator deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


