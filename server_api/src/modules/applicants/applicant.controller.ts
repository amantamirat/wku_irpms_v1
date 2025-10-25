import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../util/response';
import { ApplicantService, CreateApplicantDto, GetApplicantsOptions } from './applicant.service';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';

export class ApplicantController {

    static async createApplicant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const {
                first_name,
                last_name,
                birth_date,
                gender,
                //scope,
                organization,
                email,
                accessibility
            } = req.body;
            const data: CreateApplicantDto = {
                first_name,
                last_name,
                birth_date: new Date(birth_date),
                gender,
                //scope,
                organization: new mongoose.Types.ObjectId(organization as string),
                email,
                accessibility: accessibility || []
            };
            const created = await ApplicantService.createApplicant(data, userId);
            successResponse(res, 201, "Applicant created successfully", created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async getApplicants(req: Request, res: Response) {
        try {
            const { scope, organization } = req.query;

            let orgFilter: mongoose.Types.ObjectId[] | undefined;

            if (organization) {
                let orgs: string[] = [];

                if (Array.isArray(organization)) {
                    // repeated query params
                    orgs = organization as string[];
                } else {
                    // single string, could be comma-separated
                    orgs = (organization as string).split(',').map(o => o.trim());
                }

                orgFilter = orgs.map((id) => new mongoose.Types.ObjectId(id));
            }

            const filter = {
                //scope: scope ? scope : undefined,
                organization: orgFilter,
            } as GetApplicantsOptions;

            const applicants = await ApplicantService.getApplicants(filter);
            successResponse(res, 200, 'Applicants fetched successfully', applicants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    static async updateApplicant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const {
                first_name,
                last_name,
                birth_date,
                gender,
                organization,
                email,
                accessibility
            } = req.body;
            const data: Partial<CreateApplicantDto> = {
                first_name,
                last_name,
                birth_date: new Date(birth_date),
                gender,
                organization: new mongoose.Types.ObjectId(organization as string),
                email,
                accessibility: accessibility || []
            };
            const updated = await ApplicantService.updateApplicant(id, data, userId);
            successResponse(res, 201, "Applicant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async deleteApplicant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const { id } = req.params;
            const deleted = await ApplicantService.deleteApplicant(id, userId);
            successResponse(res, 201, "Applicant deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async linkUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const linked = await ApplicantService.autoLinkUserByEmail(id);
            successResponse(res, 201, "Applicant linked successfully", linked);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

}


