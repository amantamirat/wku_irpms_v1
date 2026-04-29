import { Request, Response } from 'express';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDTO, UpdateEnrollmentDTO } from './enrollment.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppError } from '../../../common/errors/app.error';
import { ERROR_CODES } from '../../../common/errors/error.codes';

export class EnrollmentController {

    private service: EnrollmentService;

    constructor(service: EnrollmentService) {
        this.service = service;
    }

    create = async (req: Request, res: Response) => {
        try {
            const dto: CreateEnrollmentDTO = req.body;
            const student = await this.service.create(dto);
            successResponse(res, 201, 'Enrollment created successfully', student);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const { user } = req.query;
            const students = await this.service.get({
                student: user ? user as string : undefined
            });
            successResponse(res, 200, 'Enrollments fetched successfully', students);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const { calendar, program, applicant } = req.body;

            const dto: UpdateEnrollmentDTO = {
                id,
                data: { calendar, program, student: applicant },
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Enrollment updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const deleted = await this.service.delete({
                id,
                userId: req.auth.userId,
            });

            successResponse(res, 200, 'Student deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
