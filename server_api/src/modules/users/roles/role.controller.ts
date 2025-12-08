import { Request, Response } from 'express';
import { RoleService } from './role.service';
import { errorResponse, successResponse } from '../../../util/response';
import { CreateRoleDto, UpdateRoleDto } from './role.dto';
import { AuthenticatedRequest } from '../user.middleware';

const service = new RoleService();
export class RoleController {

  static async createRole(req: Request, res: Response) {
    try {
      const data: CreateRoleDto = req.body;
      const roles = await service.create(data);
      successResponse(res, 201, "Role created successfully", roles);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await service.getAll();
      successResponse(res, 200, 'Roles fetched successfully', roles);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async updateRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { id } = req.params;
      const {
        name,
        permissions
      } = req.body;
      const dto: UpdateRoleDto = {
        id,
        data: { name, permissions },
        userId: req.user._id,
      };
      const updated = await service.update(dto);
      successResponse(res, 201, "Role updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async deleteRole(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { id } = req.params;
      const deleted = await service.delete({ id, userId: req.user._id });
      successResponse(res, 201, "Role deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


