import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { UserService, CreateUserDto, ChangePasswordDto } from './user.service';
import { UserStatus } from './user.enum';
import mongoose from 'mongoose';
import { CreateUserDTO } from './user.dto';
import { AuthenticatedRequest } from './auth/auth.middleware';

const service = new UserService();

export class UserController {

  static async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");

      const {
        user_name,
        password,
        email,
        roles,
        organizations
      } = req.body;

      const dto: CreateUserDTO = {
        user_name,
        password,
        email,
        roles,
        organizations,
        createdBy: req.user._id   // added from AuthenticatedRequest
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

  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user_name, status, roles, organizations } = req.body;
      const data: Partial<CreateUserDto> = {
        user_name: user_name ? user_name : undefined,
        status: status ? status : undefined,
        roles: roles ? roles.map((r: string) => new mongoose.Types.ObjectId(r)) : undefined,
        organizations: organizations ? organizations.map((o: string) => new mongoose.Types.ObjectId(o)) : undefined,
      };
      const updated = await UserService.updateUser(id, data);
      successResponse(res, 201, "User updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }



  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await UserService.deleteUser(id);
      successResponse(res, 201, "User deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;
      const dto: ChangePasswordDto = { oldPassword, newPassword };
      const result = await UserService.changePassword(id, dto);
      successResponse(res, 200, "Password changed successfully", result);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const result = await UserService.resetPassword(id, newPassword);
      successResponse(res, 200, "Password reset successfully", result);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


