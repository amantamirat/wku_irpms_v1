import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../util/response';
import { UserService, CreateUserDto, UpdateUserDto } from './user.service';

export class UserController {

  static async createUser(req: Request, res: Response) {
    try {
      const data: CreateUserDto = req.body;
      const theme = await UserService.createUser(data);
      successResponse(res, 201, "User created successfully", theme);
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
      const data: Partial<UpdateUserDto> = req.body;
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

}


