import { Request, Response } from 'express';
import { StudentService } from './student.service';
import { CreateStudentDTO, UpdateStudentDTO } from './student.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../auth/auth.middleware';
import { AppError } from '../../../common/errors/app.error';
import { ERROR_CODES } from '../../../common/errors/error.codes';

export class StudentController {

    private service: StudentService;

    constructor(service: StudentService) {
        this.service = service;
    }

    create = async (req: Request, res: Response) => {
        try {
            const dto: CreateStudentDTO = req.body;
            const student = await this.service.create(dto);
            successResponse(res, 201, 'Student created successfully', student);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const { applicant } = req.query;
            const students = await this.service.get({
                applicant: applicant ? applicant as string : undefined
            });
            successResponse(res, 200, 'Students fetched successfully', students);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params;
            const { calendar, program, applicant } = req.body;

            const dto: UpdateStudentDTO = {
                id,
                data: { calendar, program, applicant },
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Student updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not authorized');

            const { id } = req.params;
            const deleted = await this.service.delete({
                id,
                applicantId: req.user.applicantId,
            });

            successResponse(res, 200, 'Student deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
