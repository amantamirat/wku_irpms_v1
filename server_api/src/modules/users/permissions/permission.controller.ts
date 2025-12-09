import { Request, Response } from 'express';
import { PermissionService } from './permission.service';
import { errorResponse, successResponse } from '../../../common/helpers/response';

const service = new PermissionService();
export class PermissionController {

  static async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await service.getPermissions();
      successResponse(res, 200, 'Permissions fetched successfully', permissions);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


