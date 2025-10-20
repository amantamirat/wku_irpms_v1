import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { UserService, CreateUserDto } from './user.service';
import { UserStatus } from './user.enum';
import mongoose from 'mongoose';

export class UserController {

  static async createUser(req: Request, res: Response) {
    try {
      const { user_name, password, email, roles, status } = req.body;
      const data: CreateUserDto = {
        user_name: user_name,
        password: password,
        email: email,
        roles: roles ? roles.map((r: string) => new mongoose.Types.ObjectId(r)) : [],
        status: status as UserStatus
      };
      const created = await UserService.createUser(data);
      successResponse(res, 201, "User created successfully", created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getUsers();
      successResponse(res, 200, 'Users fetched successfully', users);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user_name, password, status, roles } = req.body;
      const data: Partial<CreateUserDto> = {
        user_name: user_name ? user_name : undefined,
        password: password ? password : undefined,
        status: status ? status : undefined,
        roles: roles ? roles.map((r: string) => new mongoose.Types.ObjectId(r)) : undefined,
      };
      const updated = await UserService.updateUser(id, data);
      successResponse(res, 201, "User updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  /*

  static async linkUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const linked = await UserService.linkApplicant(id);
      successResponse(res, 201, "User linked successfully", linked);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

  */

  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await UserService.deleteUser(id);
      successResponse(res, 201, "User deleted successfully", deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  }

}


