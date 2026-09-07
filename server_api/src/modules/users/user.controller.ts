import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../auth/auth.middleware';
import { UserService } from './user.service';
import {
    CreateUserDTO,
    FilterUsersDTO,
    UpdateUserDTO,
    UpdateOwnershipsDTO,
    UpdateRolesDTO,
} from './user.dto';

export class UserController {

    constructor(private readonly service: UserService) {
    }

    // POST /applicants
    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error('User not authorized');

            const {
                workspace,
                name,
                birthDate,
                gender,
                fin,
                orcid,
                accessibility,
                specializations
            } = req.body;

            const dto: CreateUserDTO = {
                workspace,
                name,
                birthDate: new Date(birthDate),
                gender,
                fin,
                orcid,
                accessibility: accessibility || [],
                specializations
            };

            const created = await this.service.create(dto);
            successResponse(res, 201, 'User created successfully', created);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // GET /applicants
    get = async (req: Request, res: Response) => {
        try {
            const { workspace } = req.query;

            const filter: FilterUsersDTO = {
                workspace: workspace as string,
            };

            const users = await this.service.getAll(filter, { populate: true });

            successResponse(res, 200, "Users fetched successfully", users);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    lookup = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error('User not authorized');
            const { search, workspace } = req.query;
            const filter: FilterUsersDTO = {
                workspace: workspace as string,
            };
            const users = await this.service.lookup(filter);
            successResponse(res, 200, 'Users lookup fetched successfully', users);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error('User not authorized');

            const { id } = req.params;
            const {
                workspace,
                name,
                birthDate,
                gender,
                fin,
                orcid,
                accessibility,
                specializations,
            } = req.body;

            const dto: UpdateUserDTO = {
                id,
                userId: req.auth.userId,
                data: {
                    workspace,
                    name,
                    birthDate,
                    gender,
                    fin,
                    orcid,
                    accessibility,
                    specializations,
                },
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'User updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // PATCH /applicants/roles?id=xxx
    updateRoles = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error('User not authorized');

            const { id } = req.params;
            const { roles } = req.body;

            const dto: UpdateRolesDTO = {
                id,
                roles,
                userId: req.auth.userId,
            };

            const updated = await this.service.updateRoles(dto);
            successResponse(res, 200, 'User roles updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // PATCH /applicants/ownerships?id=xxx
    updateOwnerships = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error('User not authorized');

            const { id } = req.params;
            const { ownerships } = req.body;

            const dto: UpdateOwnershipsDTO = {
                id,
                ownerships,
                userId: req.auth.userId,
            };

            const updated = await this.service.updateOwnerships(dto);
            successResponse(res, 200, 'User ownerships updated successfully', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // DELETE /applicants?id=xxx
    delete = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth) throw new Error('User not authorized');
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, 'User deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
