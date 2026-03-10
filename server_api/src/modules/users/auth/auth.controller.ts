import { Request, Response } from 'express';

import { AuthenticatedRequest } from './auth.middleware';
import {
  ChangePasswordDTO,
  CreateAuthDTO,
  LoginDto,
  UpdateAuthDTO,
  VerfyAuthDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { AuthStatus } from './auth.status';
import { errorResponse, successResponse } from '../../../common/helpers/response';
import { DeleteDto } from '../../../common/dtos/delete.dto';

export class AuthController {

  private service: AuthService;

  constructor(service?: AuthService) {
    this.service = service || new AuthService();
  }

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('Auth not authorized');

      const { email, applicant, password } = req.body;

      const dto: CreateAuthDTO = {
        applicant,
        //email,
        password
      };

      const created = await this.service.create(dto);
      successResponse(res, 201, 'Auth created successfully', created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  get = async (_req: Request, res: Response) => {
    try {
      const users = await this.service.getAuths();
      successResponse(res, 200, 'Auths fetched successfully', users);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('Auth not authorized');

      const { id } = req.query;
      const { password } = req.body;

      const dto: UpdateAuthDTO = {
        id: id as string,
        data: { password },
        userId: req.user.userId,
      };

      const updated = await this.service.update(dto);
      successResponse(res, 200, 'Auth updated successfully', updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  updateStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('Auth not authorized');

      const { id } = req.query;
      const { status } = req.params;

      const dto: UpdateAuthDTO = {
        id: id as string,
        data: { status: status as AuthStatus },
        userId: req.user.userId,
      };

      const updated = await this.service.updateStatus(dto);
      successResponse(res, 200, 'Auth status updated successfully', updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('Auth not authorized');

      const { id } = req.query;

      const dto: DeleteDto = {
        id: id as string,
        applicantId: req.user.userId,
      };

      const deleted = await this.service.delete(dto);
      successResponse(res, 200, 'Auth deleted successfully', deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const data: LoginDto = req.body;
      const loggedInAuth = await this.service.login(data);
      successResponse(res, 200, 'Auth logged in successfully', loggedInAuth);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('Auth not authorized');

      const { currentPassword, password } = req.body;

      const dto: ChangePasswordDTO = {
        id: req.user.userId,
        data: { currentPassword, password },
        //userId: req.user.userId,
      };
      const updated = await this.service.changePassword(dto);
      successResponse(res, 200, 'Password changed successfully', updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  sendVerificationCode = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this.service.sendCode(email);
      successResponse(res, 200, 'Verification code sent to email.', { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  resetAuth = async (req: Request, res: Response) => {
    try {
      const data: VerfyAuthDto = req.body;
      await this.service.resetPassword(data);
      successResponse(res, 200, 'Password reset successfully', { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  activateAuth = async (req: Request, res: Response) => {
    try {
      const data: VerfyAuthDto = req.body;
      await this.service.activateAuth(data);
      successResponse(res, 200, 'Auth activated successfully', { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}
