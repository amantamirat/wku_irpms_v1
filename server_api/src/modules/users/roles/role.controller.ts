import { Request, Response } from 'express';
import { RoleService, CreateRoleDto } from './role.service';
import { errorResponse, successResponse } from '../../../util/response';

export class RoleController {

  static async createRole(req: Request, res: Response) {
    try {
      const data: CreateRoleDto = req.body;
      const roles = await RoleService.createRole(data);
      successResponse(res, 201, "Role created successfully", roles);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await RoleService.getRoles();
      successResponse(res, 200, 'Roles fetched successfully', roles);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async updateRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data: Partial<CreateRoleDto> = req.body;
      const updated = await RoleService.updateRole(id, data);
      successResponse(res, 201, "Role updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async deleteRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await RoleService.deleteRole(id);
      successResponse(res, 201, "Role deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


