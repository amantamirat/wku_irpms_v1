import { Request, Response } from 'express';
import { DeleteDto } from '../../util/delete.dto';
import { errorResponse, successResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from './user.middleware';
import { ChangePasswordDTO, CreateUserDTO, LoginDto, UpdateUserDTO, VerfyUserDto } from './user.dto';
import { UserService } from './user.service';
import { UserStatus } from './user.status';

const service = new UserService();

export class UserController {

  static async login(req: Request, res: Response) {
    try {
      const data: LoginDto = req.body;
      const loggedInUser = await service.login(data);
      successResponse(res, 201, "User logged in successfully", loggedInUser);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { email, password } = req.body;
      const dto: CreateUserDTO = {
        email,
        password,
        //createdBy: req.user._id
      };
      const created = await service.create(dto);
      successResponse(res, 201, "User created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const users = await service.getUsers();
      successResponse(res, 200, 'Users fetched successfully', users);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { id } = req.params;
      const { password } = req.body;
      const dto: UpdateUserDTO = {
        id,
        data: {
          password
        },
        userId: req.user.userId,
      };
      const updated = await service.update(dto);
      successResponse(res, 201, "User updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async changeStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { id } = req.params;
      const { status } = req.body;

      const dto: UpdateUserDTO = {
        id,
        data: { status },
        userId: req.user.userId,
      };
      if (status === UserStatus.deleted) {
        throw new Error("deletetion through this function is not supported");
      }
      const updated = await service.changeStatus(dto);
      successResponse(res, 201, "User status updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { id } = req.params;
      const dto: DeleteDto = {
        id,
        userId: req.user.userId
      };
      const deleted = await service.delete(dto);
      successResponse(res, 201, "User deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }


  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { id } = req.params;
      const { currentPassword, password } = req.body;
      const dto: ChangePasswordDTO =
      {
        id,
        data: { currentPassword, password: password },
        userId: req.user.userId,
      };
      const updated = await service.changePassword(dto);
      successResponse(res, 200, "Password changed successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }


  static async sendVerificationCode(req: Request, res: Response) {
    try {
      const email = req.body.email;
      await service.sendCode(email);
      successResponse(res, 200, 'Verfification code sent to email.', { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async resetUser(req: Request, res: Response) {
    try {
      const data: VerfyUserDto = req.body;
      await service.resetPassword(data);
      successResponse(res, 201, "Password resetted successfully", { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async activateUser(req: Request, res: Response) {
    try {
      const data: VerfyUserDto = req.body;
      await service.activateUser(data);
      successResponse(res, 201, "User activated successfully", { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }





}


