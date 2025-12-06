import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../util/response';
import { GetApplicantsOptions } from './applicant.service';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { ApplicantService } from './app.service';
import { CreateApplicantDTO, UpdateApplicantDTO } from './applicant.dto';

const service = new ApplicantService();
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
                organization,
                //email,
                accessibility
            } = req.body;
            const data: CreateApplicantDTO = {
                first_name,
                last_name,
                birth_date: new Date(birth_date),
                gender,
                organization,
                //email,
                accessibility: accessibility || []
            };
            const created = await service.create(data);
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

            const applicants = await service.getAll({});
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
                //email,
                accessibility
            } = req.body;

            const dto: UpdateApplicantDTO = {
                id,
                data: {
                    first_name,
                    last_name,
                    birth_date,
                    gender,
                    organization,
                    //email,
                    accessibility
                },
                userId: userId
            };
            const updated = await service.update(dto);
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
            //const userId = req.user._id;
            const { id } = req.params;
            const deleted = await service.delete(id);
            successResponse(res, 201, "Applicant deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    /*
    static async linkUser(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const linked = await ApplicantService.autoLinkUserByEmail(id);
            successResponse(res, 201, "Applicant linked successfully", linked);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
    */

}


