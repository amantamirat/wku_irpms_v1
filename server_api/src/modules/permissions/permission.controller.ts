import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../users/auth/auth.middleware';
import { UpdatePermissionDto } from './permission.dto';
import { PermissionService } from './permission.service';

export class PermissionController {

  private service: PermissionService;

  constructor(service: PermissionService) {
    this.service = service;
  }

  getPermissions = async (req: Request, res: Response) => {
    try {
      const permissions = await this.service.getPermissions();
      successResponse(res, 200, 'Permissions fetched successfully', permissions);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const dto: UpdatePermissionDto = {
        id,
        data: { name, description }
      };
      const updated = await this.service.update(dto);
      successResponse(res, 200, "Permission updated", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.service.delete(id);
      successResponse(res, 200, 'Permission deleted', deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}
