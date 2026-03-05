import { Request, Response } from 'express';
import { DeleteDto } from '../../util/delete.dto';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from './user.middleware';
import {
  ChangePasswordDTO,
  CreateUserDTO,
  LoginDto,
  UpdateUserDTO,
  VerfyUserDto,
} from './user.dto';
import { UserService } from './user.service';
import { UserStatus } from './user.status';

export class UserController {

  private service: UserService;

  constructor(service?: UserService) {
    this.service = service || new UserService();
  }

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('User not authorized');

      const { email, applicant, password } = req.body;

      const dto: CreateUserDTO = {
        applicant,
        //email,
        password
      };

      const created = await this.service.create(dto);
      successResponse(res, 201, 'User created successfully', created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  get = async (_req: Request, res: Response) => {
    try {
      const users = await this.service.getUsers();
      successResponse(res, 200, 'Users fetched successfully', users);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('User not authorized');

      const { id } = req.query;
      const { password } = req.body;

      const dto: UpdateUserDTO = {
        id: id as string,
        data: { password },
        userId: req.user.userId,
      };

      const updated = await this.service.update(dto);
      successResponse(res, 200, 'User updated successfully', updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  updateStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('User not authorized');

      const { id } = req.query;
      const { status } = req.params;

      const dto: UpdateUserDTO = {
        id: id as string,
        data: { status: status as UserStatus },
        userId: req.user.userId,
      };

      const updated = await this.service.updateStatus(dto);
      successResponse(res, 200, 'User status updated successfully', updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('User not authorized');

      const { id } = req.query;

      const dto: DeleteDto = {
        id: id as string,
        applicantId: req.user.userId,
      };

      const deleted = await this.service.delete(dto);
      successResponse(res, 200, 'User deleted successfully', deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const data: LoginDto = req.body;
      const loggedInUser = await this.service.login(data);
      successResponse(res, 200, 'User logged in successfully', loggedInUser);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error('User not authorized');

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

  resetUser = async (req: Request, res: Response) => {
    try {
      const data: VerfyUserDto = req.body;
      await this.service.resetPassword(data);
      successResponse(res, 200, 'Password reset successfully', { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  activateUser = async (req: Request, res: Response) => {
    try {
      const data: VerfyUserDto = req.body;
      await this.service.activateUser(data);
      successResponse(res, 200, 'User activated successfully', { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}
