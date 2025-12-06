import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { errorResponse, successResponse } from '../../util/response';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { ApplicantService } from './app.licant.service';
import { CreateApplicantDTO, GetApplicantsDTO, UpdateApplicantDTO } from './applicant.dto';

const service = new ApplicantService();
export class ApplicantController {

    static async createApplicant(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user._id;
            const {
                workspace,
                name,
                lastName,
                birthDate,
                gender,
                organization,
                email,
                accessibility
            } = req.body;
            const data: CreateApplicantDTO = {
                workspace,
                name,
                //lastName,
                birthDate: new Date(birthDate),
                gender,
                email,
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
            const { workspace } = req.query;
            const filter = {
                workspace: workspace,
            } as GetApplicantsDTO;

            const applicants = await service.getAll(filter);
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
                workspace,
                name,
                //lastName,
                birthDate,
                gender,
                email,
                accessibility,
                roles,
                ownerships,
            } = req.body;

            const dto: UpdateApplicantDTO = {
                id,
                data: {
                    workspace,
                    name,
                    //lastName,
                    birthDate,
                    gender,
                    email,
                    accessibility,
                    roles,
                    ownerships
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


