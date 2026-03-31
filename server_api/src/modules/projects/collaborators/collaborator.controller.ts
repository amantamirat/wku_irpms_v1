import { Response } from 'express';
import { DeleteDto } from '../../../common/dtos/delete.dto';
import { TransitionRequestDto } from '../../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../../common/errors/error.codes';
import { errorResponse, successResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/auth/auth.middleware';
import {
    CreateCollaboratorDto
} from './collaborator.dto';
import { CollaboratorService } from './collaborator.service';

export class CollaboratorController {
    

    constructor(private readonly service: CollaboratorService) {
    }
    // -----------------------
    // Create
    // -----------------------
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not found!');

            const { project, applicant, isLeadPI } = req.body;

            const dto: CreateCollaboratorDto = {
                applicant: applicant as string,
                project: project as string,
                //isLeadPI: isLeadPI ? true : undefined,
                userId: req.user.applicantId,
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, 'Collaborator created successfully', created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Fetch / Query
    // -----------------------
    get = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { project, applicant, populate } = req.query;

            const collaborators = await this.service.get({
                project: project ? (project as string) : undefined,
                applicant: applicant ? (applicant as string) : undefined,
                ...(populate !== undefined && { populate: populate === "true" })
            });
            successResponse(res, 200, 'Collaborators fetched successfully', collaborators);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };



    /**
     * update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not found!');

            const { id } = req.params;
            const { isLeadPI } = req.body;

            const dto: UpdateCollaboratorDto = {
                id,
                data: {
                    isLeadPI: isLeadPI ? true : undefined,
                    // status can be added here if needed
                },
                applicantId: req.user._id,
            };

            const updated = await this.service.updateCollaborator(dto);
            successResponse(res, 200, 'Collaborator updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
     * 
     */

    transitionState = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
            const { id } = req.params;
            const { current, next } = req.body;
            const dto: TransitionRequestDto = {
                id: String(id),
                current: current,
                next: next,
                applicantId: req.user.applicantId,
            };
            const updated = await this.service.transitionState(dto);
            successResponse(res, 200, "Collaborator status updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    // -----------------------
    // Delete
    // -----------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;

            const dto: DeleteDto = {
                id,
                applicantId: req.user.applicantId,
            };

            const deleted = await this.service.delete(dto);
            successResponse(res, 200, 'Collaborator deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
