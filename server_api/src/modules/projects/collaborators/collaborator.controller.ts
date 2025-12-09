import { Response } from 'express';
import { DeleteDto } from '../../../util/delete.dto';
import { errorResponse, successResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
} from './collaborator.dto';
import { CollaboratorService } from './collaborator.service';

const service = new CollaboratorService();

export class CollaboratorController {

    static async createCollaborator(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');

            const { project, applicant, isLeadPI } = req.body;
            const dto: CreateCollaboratorDto = {
                applicant: applicant as string,
                project: project as string,
                isLeadPI: isLeadPI ? true : undefined,
                userId: req.user._id,
            };

            const created = await service.createCollaborator(dto);
            successResponse(res, 201, 'Collaborator created successfully', created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getCollaborators(req: AuthenticatedRequest, res: Response) {
        try {
            const { project, applicant, user } = req.query;

            const filter: GetCollaboratorsOptions = {
                project: project ? project as string : undefined,
                applicant: applicant ? applicant as string : undefined,
                //userId: user && req.user ? req.user._id : undefined,
            };

            const collaborators = await service.getCollaborators(filter);
            successResponse(res, 200, 'Collaborators fetched successfully', collaborators);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    static async changeCollaboratorStatus(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const { id } = req.params;
            const { status } = req.body;

            const dto: UpdateCollaboratorDto = { id, data: { status }, userId: req.user._id };
            const updated = await service.changeCollaboratorStatus(dto);

            successResponse(res, 200, `Collaborator status changed to ${status}`, updated);
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
                   // status: status as CollaboratorStatus,
                },
                userId: req.user._id,
            };

            const updated = await service.updateCollaborator(dto);
            successResponse(res, 200, 'Collaborator updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteCollaborator(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error('User not found!');

            const { id } = req.params;
            const dto: DeleteDto = { id, userId: req.user._id };

            const deleted = await service.deleteCollaborator(dto);
            successResponse(res, 200, 'Collaborator deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


