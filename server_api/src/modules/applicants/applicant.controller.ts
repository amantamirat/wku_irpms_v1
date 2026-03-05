import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../users/user.middleware';
import { ApplicantService } from './applicant.service';
import {
    CreateApplicantDTO,
    GetApplicantsDTO,
    UpdateApplicantDTO,
    UpdateOwnershipsDTO,
    UpdateRolesDTO,
} from './applicant.dto';

export class ApplicantController {

    private service: ApplicantService;

    constructor(service?: ApplicantService) {
        this.service = service || new ApplicantService();
    }

    // POST /applicants
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not authorized');

            const {
                workspace,
                name,
                birthDate,
                gender,
                fin,
                orcid,
                email,
                accessibility,
                specializations
            } = req.body;

            const dto: CreateApplicantDTO = {
                workspace,
                name,
                birthDate: new Date(birthDate),
                gender,
                fin,
                orcid,
                email,
                accessibility: accessibility || [],
                specializations
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, 'Applicant created successfully', created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // GET /applicants
    get = async (req: Request, res: Response) => {
        try {
            const { workspace } = req.query;

            const filter: GetApplicantsDTO = {
                workspace: workspace as string,
            };

            const applicants = await this.service.getAll(filter);
            successResponse(res, 200, 'Applicants fetched successfully', applicants);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // PUT /applicants?id=xxx
    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not authorized');

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
            } = req.body;

            const dto: UpdateApplicantDTO = {
                id,
                userId: req.user.userId,
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
                },
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Applicant updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // PATCH /applicants/roles?id=xxx
    updateRoles = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not authorized');

            const { id } = req.params;
            const { roles } = req.body;

            const dto: UpdateRolesDTO = {
                id,
                roles,
                applicantId: req.user.applicantId,
            };

            const updated = await this.service.updateRoles(dto);
            successResponse(res, 200, 'Applicant roles updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // PATCH /applicants/ownerships?id=xxx
    updateOwnerships = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not authorized');

            const { id } = req.params;
            const { ownerships } = req.body;

            const dto: UpdateOwnershipsDTO = {
                id,
                ownerships,
                applicantId: req.user.applicantId,
            };

            const updated = await this.service.updateOwnerships(dto);
            successResponse(res, 200, 'Applicant ownerships updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // DELETE /applicants?id=xxx
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not authorized');
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, 'Applicant deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
