import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../users/user.middleware';
import { ApplicantService } from './applicant.service';
import { CreateApplicantDTO, GetApplicantsDTO, UpdateApplicantDTO, UpdateOwnershipsDTO, UpdateRolesDTO } from './applicant.dto';

const service = new ApplicantService();
export class ApplicantController {

    static async create(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user.userId;
            const {
                workspace,
                name,
                birthDate,
                gender,
                fin,
                orcid,
                email,
                accessibility
            } = req.body;
            const data: CreateApplicantDTO = {
                workspace,
                name,
                birthDate: new Date(birthDate),
                gender,
                fin,
                orcid,
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


    static async update(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) {
                throw new Error("User not found!");
            }
            const userId = req.user.userId;
            const { id } = req.params;
            const {
                workspace,
                name,
                birthDate,
                gender,
                fin,
                orcid,
                email,
                accessibility,
                specializations,
                //roles,
                //ownerships,
            } = req.body;

            const dto: UpdateApplicantDTO = {
                id,
                data: {
                    workspace,
                    name,
                    birthDate,
                    gender,
                    fin,
                    orcid,
                    email,
                    accessibility,
                    specializations,
                    //roles,
                    //ownerships
                },
                userId: userId
            };
            const updated = await service.update(dto);
            successResponse(res, 201, "Applicant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateRoles(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");
            const applicantId = req.user.applicantId;
            const { id } = req.params;
            const {
                roles
            } = req.body;

            const dto: UpdateRolesDTO = {
                id,
                roles,
                applicantId
            };
            const updated = await service.updateRoles(dto);
            successResponse(res, 201, "Applicant updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async updateOwnerships(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user) throw new Error("User not found!");

            const applicantId = req.user.applicantId; // actor
            const { id } = req.params;                 // target
            const { ownerships } = req.body;

            const dto: UpdateOwnershipsDTO = {
                id,
                ownerships,
                applicantId
            };

            const updated = await service.updateOwnerships(dto);
            successResponse(res, 201, "Applicant ownerships updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    static async delete(req: AuthenticatedRequest, res: Response) {
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


