import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { ApplicantService, CreateApplicantDto, GetApplicantsOptions } from './applicant.service';
import { Types } from 'mongoose';

export class ApplicantController {

    static async createApplicant(req: Request, res: Response) {
        try {
            const data: CreateApplicantDto = req.body;
            const theme = await ApplicantService.createApplicant(data);
            successResponse(res, 201, "Applicant created successfully", theme);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getApplicants(req: Request, res: Response) {
        try {
            const { scope, organization } = req.query;
            const filter = {
                scope: scope ? scope : undefined,
                organization: organization ? new Types.ObjectId(organization as string) : undefined
            } as GetApplicantsOptions;
            const applicants = await ApplicantService.getApplicants(filter);
            successResponse(res, 200, 'Applicants fetched successfully', applicants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateApplicant(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data: Partial<CreateApplicantDto> = req.body;
            const updated = await ApplicantService.updateApplicant(id, data);
            successResponse(res, 201, "Applicant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteApplicant(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await ApplicantService.deleteApplicant(id);
            successResponse(res, 201, "Applicant deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


