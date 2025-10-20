import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../util/response';
import { ApplicantService, CreateApplicantDto, GetApplicantsOptions } from './applicant.service';

export class ApplicantController {

    static async createApplicant(req: Request, res: Response) {
        try {
            const {
                first_name,
                last_name,
                birth_date,
                gender,
                scope,
                organization,
                email,
                accessibility
            } = req.body;
            const data: CreateApplicantDto = {
                first_name,
                last_name,
                birth_date: new Date(birth_date),
                gender,
                scope,
                organization: new mongoose.Types.ObjectId(organization as string),
                email,
                accessibility: accessibility || []
            };
            const created = await ApplicantService.createApplicant(data);
            successResponse(res, 201, "Applicant created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getApplicants(req: Request, res: Response) {
        try {
            const { scope, organization } = req.query;
            const filter = {
                scope: scope ? scope : undefined,
                organization: organization ? new mongoose.Types.ObjectId(organization as string) : undefined
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

    static async linkApplicant(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const linked = await ApplicantService.autoLinkUserByEmail(id);
            successResponse(res, 201, "Applicant linked successfully", linked);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


