import { Response } from 'express';
import { DeleteDto } from '../../../common/dtos/delete.dto';
import { TransitionRequestDto } from '../../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../../common/errors/error.codes';
import { errorResponse, successResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import {
    CreateCollaboratorDto,
    UpdateCollaboratorDto
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

            const { project, applicant, role, isLeadPI } = req.body;

            const dto: CreateCollaboratorDto = {
                applicant: applicant as string,
                project: project as string,
                //isLeadPI: isLeadPI ? true : undefined,
                role,
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



    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const { role, isLeadPI } = req.body;

            const dto: UpdateCollaboratorDto = {
                id,
                data: {
                    role,
                    //isLeadPI: isLeadPI ? true : undefined,
                },
                applicantId: req.user.applicantId,
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Collaborator updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


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
