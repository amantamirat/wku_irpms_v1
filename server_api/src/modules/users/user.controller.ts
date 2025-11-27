import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { UserService, CreateUserDto, ChangePasswordDto } from './user.service';
import { UserStatus } from './user.enum';
import mongoose from 'mongoose';
import { CreateUserDTO, UpdateUserDTO } from './user.dto';
import { AuthenticatedRequest } from './auth/auth.middleware';
import { DeleteDto } from '../../util/delete.dto';

const service = new UserService();

export class UserController {

  static async createUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");

      const { user_name, password, email, roles, organizations } = req.body;

      const dto: CreateUserDTO = {
        user_name,
        password,
        email,
        roles,
        organizations,
        createdBy: req.user._id
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

  static async updateUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error("User not authorized!");
      const { id } = req.params;
      const { roles, organizations } = req.body;

      const dto: UpdateUserDTO = {
        id,
        data: { roles, organizations },
        userId: req.user._id,
      };
      const updated = await service.update(dto);

      successResponse(res, 201, "User updated successfully", updated);
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
        userId: req.user._id
      };
      const deleted = await service.delete(dto);
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


