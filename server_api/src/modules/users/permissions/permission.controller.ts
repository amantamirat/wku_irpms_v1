import { Request, Response } from 'express';
import { PermissionService } from './permission.service';
import { errorResponse, successResponse } from '../../../common/helpers/response';

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
}
