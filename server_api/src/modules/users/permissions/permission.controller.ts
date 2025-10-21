import { Request, Response } from 'express';
import { PermissionService } from './permission.service';
import { errorResponse, successResponse } from '../../../util/response';

export class PermissionController {

  static async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await PermissionService.getPermissions();
      successResponse(res, 200, 'Permissions fetched successfully', permissions);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }  

}


