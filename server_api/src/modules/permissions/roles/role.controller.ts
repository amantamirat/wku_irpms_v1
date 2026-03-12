import { Request, Response } from 'express';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';
import { successResponse, errorResponse } from '../../../common/helpers/response';
import { AuthenticatedRequest } from '../../users/user.middleware';


export class RoleController {

    constructor(private readonly service: RoleService) {}

    create = async (req: Request, res: Response) => {
        try {
            const dto: CreateRoleDto = req.body;
            const role = await this.service.create(dto);
            successResponse(res, 201, 'Role created successfully', role);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    get = async (req: Request, res: Response) => {
        try {
            const roles = await this.service.getAll();
            successResponse(res, 200, 'Roles fetched successfully', roles);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    update = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new Error('User not authorized');

            const { id } = req.params;
            const { name, permissions, isDefault } = req.body;

            const dto: UpdateRoleDto = {
                id,
                data: { name, permissions, isDefault },
                userId: req.user.userId,
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, 'Role updated successfully', updated);
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
                applicantId: req.user.userId,
            });

            successResponse(res, 200, 'Role deleted successfully', deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}
