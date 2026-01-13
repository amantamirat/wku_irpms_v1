import { Response } from 'express';
import { DeleteDto } from '../../../util/delete.dto';
import { errorResponse, successResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto,
    UpdateCollabStatusDTO,
} from './collaborator.dto';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorStatus } from './collaborator.status';
import { ERROR_CODES } from '../../../common/errors/error.codes';

export class CollaboratorController {
    private service: CollaboratorService;

    constructor(service: CollaboratorService) {
        this.service = service;
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
                isLeadPI: isLeadPI ? true : undefined,
                applicantId: req.user.applicantId,
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
            const { project, applicant } = req.query;

            const filter: GetCollaboratorsOptions = {
                project: project ? (project as string) : undefined,
                applicant: applicant ? (applicant as string) : undefined,
            };

            const collaborators = await this.service.get(filter);
            successResponse(res, 200, 'Collaborators fetched successfully', collaborators);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Change Status
    // -----------------------
    updateStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error(ERROR_CODES.USER_NOT_FOUND);
            const { id } = req.params;
            const { status } = req.body;
            
            const dto: UpdateCollabStatusDTO = {
                id: String(id),
                status: status as CollaboratorStatus,
                applicantId: req.user.applicantId,
            };

            const updated = await this.service.updateStatus(dto);
            successResponse(res, 200,
                `Collaborator status changed to ${status}`,
                updated
            );
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


    // -----------------------
    // Delete
    // -----------------------
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not found!');

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
