import { Request, Response } from 'express';
import { PublicationService } from './publication.service';
import {
    CreatePublicationDTO,
    UpdatePublicationDTO
} from './publication.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';
import { AppError } from '../../../common/errors/app.error';
import { ERROR_CODES } from '../../../common/errors/error.codes';

export class PublicationController {

    private service: PublicationService;

    constructor(service: PublicationService) {
        this.service = service;
    }

    create = async (req: Request, res: Response) => {
        try {
            const dto: CreatePublicationDTO = req.body;
            const publication = await this.service.create(dto);
            successResponse(res, 201, 'Publication created successfully', publication);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const { applicant, type } = req.query;

            const publications = await this.service.get({
                applicant: applicant ? applicant as string : undefined,
                type: type ? type as any : undefined,
            });

            successResponse(res, 200, 'Publications fetched successfully', publications);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            }

            const { id } = req.params;
            const {
                title,
                abstract,
                publishedDate,
                doi,
                url,
                publisher,
                publicationId
            } = req.body;

            const dto: UpdatePublicationDTO = {
                id,
                data: {
                    title,
                    abstract,
                    publishedDate,
                    doi,
                    url,
                    publisher,
                    publicationId,
                },
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Publication updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new Error('User not authorized');
            }

            const { id } = req.params;

            const deleted = await this.service.delete({
                id,
                applicantId: req.user.applicantId,
            });

            successResponse(res, 200, 'Publication deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
