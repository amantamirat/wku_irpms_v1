import { Request, Response } from 'express';
import { ExperienceService } from './experience.service';
import {
    CreateExperienceDTO,
    UpdateExperienceDTO,
    GetExperiencesDTO,
    DeleteExperienceDTO
} from './experience.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppError } from '../../../common/errors/app.error';
import { ERROR_CODES } from '../../../common/errors/error.codes';

export class ExperienceController {

    private service: ExperienceService;

    constructor(service: ExperienceService) {
        this.service = service;
    }

    // --- Create Experience ---
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }
            const dto: CreateExperienceDTO = {
                ...req.body,
                userId: req.user.applicantId
            };
            const created = await this.service.create(dto);
            successResponse(res, 201, 'Experience created successfully', created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // --- Get Experiences ---
    get = async (req: Request, res: Response) => {
        try {
            const { user } = req.query;

            const filter: GetExperiencesDTO = {
                user: user ? user as string : undefined
            };

            const experiences = await this.service.getExperiences(filter);
            successResponse(res, 200, 'Experiences fetched successfully', experiences);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // --- Update Experience ---
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;

            const dto: UpdateExperienceDTO = {
                id,
                data: {
                    position: req.body.position,
                    organization: req.body.organization,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    isCurrent: req.body.isCurrent,
                    employmentType: req.body.employmentType
                },
                userId: req.user.applicantId
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Experience updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // --- Delete Experience ---
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }

            const { id } = req.params;

            const dto: DeleteExperienceDTO = {
                id,
                userId: req.user.applicantId
            };

            const deleted = await this.service.delete(dto);
            successResponse(res, 200, 'Experience deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
