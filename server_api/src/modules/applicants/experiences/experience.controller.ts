import { Request, Response } from 'express';
import { ExperienceService } from './experience.service';
import {
    CreateExperienceDTO,
    UpdateExperienceDTO,
    GetExperiencesDTO,
    DeleteExperienceDTO
} from './experience.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';
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
                throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            }

            const dto: CreateExperienceDTO = {
                ...req.body,
                userId: req.user.userId
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
            const { applicant } = req.query;

            const filter: GetExperiencesDTO = {
                applicant: applicant ? applicant as string : undefined
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
                throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            }

            const { id } = req.params;

            const dto: UpdateExperienceDTO = {
                id,
                data: {
                    jobTitle: req.body.jobTitle,
                    organization: req.body.organization,
                    rank: req.body.rank,
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    isCurrent: req.body.isCurrent,
                    employmentType: req.body.employmentType
                },
                userId: req.user.userId
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
                throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            }

            const { id } = req.params;

            const dto: DeleteExperienceDTO = {
                id,
                userId: req.user.userId
            };

            const deleted = await this.service.delete(dto);
            successResponse(res, 200, 'Experience deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
