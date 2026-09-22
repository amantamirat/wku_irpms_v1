import { Request, Response } from 'express';

import {
    successResponse,
    errorResponse
} from '../../common/helpers/response';

import { AuthenticatedRequest } from '../auth/auth.middleware';

import { UserService } from './user.service';

import {
    CreateUserDTO,
    FilterUsersDTO,
    UpdateUserDTO,
    UpdateRolesDTO
} from './user.dto';

export class UserController {

    constructor(
        private readonly service: UserService
    ) { }

    create = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.auth?.userId) return;

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
                birthDate: birthDate
                    ? new Date(birthDate)
                    : undefined,
                gender,
                fin,
                orcid,
                accessibility: accessibility ?? [],
                specializations
            };

            const created = await this.service.create(
                dto,
                req.auth.userId
            );

            successResponse(
                res,
                201,
                'User created successfully',
                created
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // GET /users
    get = async (
        req: Request,
        res: Response
    ) => {
        try {
            const {
                workspace,
                name,
                specialization,
                role
            } = req.query;

            const filter: FilterUsersDTO = {
                workspace: workspace as string,
                name: name as string,
                specialization: specialization as string,
                role: role as string
            };

            const users = await this.service.getAll(
                filter,
                { populate: true }
            );

            successResponse(
                res,
                200,
                'Users fetched successfully',
                users
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    // GET /users/lookup
    lookup = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth?.userId) return;

            const {
                workspace,
                name,
                specialization,
                role
            } = req.query;

            const filter: FilterUsersDTO = {
                workspace: workspace as string,
                name: name as string,
                specialization: specialization as string,
                role: role as string
            };

            const users = await this.service.lookup(filter);

            successResponse(
                res,
                200,
                'Users lookup fetched successfully',
                users
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    // GET /users/deleted
    getDeleted = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth?.userId) return;

            const {
                workspace,
                name,
                specialization,
                role
            } = req.query;

            const filter: FilterUsersDTO = {
                workspace: workspace as string,
                name: name as string,
                specialization: specialization as string,
                role: role as string
            };

            const users = await this.service.getDeleted(
                filter,
                { populate: true }
            );

            successResponse(
                res,
                200,
                'Deleted users fetched successfully',
                users
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    // PATCH /users/:id
    update = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth?.userId) return;

            const { id } = req.params;

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

            const dto: UpdateUserDTO = {
                id,
                data: {
                    workspace,
                    name,
                    birthDate,
                    gender,
                    fin,
                    orcid,
                    accessibility,
                    specializations
                }
            };

            const updated = await this.service.update(
                dto,
                req.auth.userId
            );

            successResponse(
                res,
                200,
                'User updated successfully',
                updated
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    // PATCH /users/:id/roles
    updateRoles = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth?.userId) return;

            const { id } = req.params;
            const { roles } = req.body;

            const dto: UpdateRolesDTO = {
                id,
                roles
            };

            const updated = await this.service.updateRoles(
                dto,
                req.auth.userId
            );

            successResponse(
                res,
                200,
                'User roles updated successfully',
                updated
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    // PATCH /users/:id/scope
    updateScope = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth?.userId) return;

            const { id } = req.params;
            const { scope } = req.body;

            const updated = await this.service.updateScope(
                id,
                scope,
                req.auth.userId
            );

            successResponse(
                res,
                200,
                'User scope updated successfully',
                updated
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    // DELETE /users/:id
    delete = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth?.userId) return;

            const { id } = req.params;

            const deleted = await this.service.delete(
                id,
                req.auth.userId
            );

            successResponse(
                res,
                200,
                'User deleted successfully',
                deleted
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };

    // PATCH /users/:id/restore
    restore = async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        try {
            if (!req.auth?.userId) return;

            const { id } = req.params;

            const restored = await this.service.restore(
                id,
                req.auth.userId
            );

            successResponse(
                res,
                200,
                'User restored successfully',
                restored
            );
        } catch (err: any) {
            errorResponse(
                res,
                400,
                err.message,
                err
            );
        }
    };
}