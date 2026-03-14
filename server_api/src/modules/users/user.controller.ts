import { Request, Response } from 'express';
import { DeleteDto } from '../../common/dtos/delete.dto';
import { errorResponse, successResponse } from '../../common/helpers/response';
import {
  CreateUserDTO,
  UpdateUserDTO,
} from './user.dto';
import { AuthenticatedRequest } from './user.middleware';
import { UserService } from './user.service';

import { TransitionRequestDto } from '../../common/dtos/transition.dto';
import { ERROR_CODES } from '../../common/errors/error.codes';

export class UserController {

  private service: UserService;

  constructor(service?: UserService) {
    this.service = service || new UserService();
  }

  create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dto: CreateUserDTO = req.body;
      const created = await this.service.create(dto);
      successResponse(res, 201, 'User created successfully', created);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  get = async (req: Request, res: Response) => {
    try {
      const users = await this.service.getUsers();
      successResponse(res, 200, 'Users fetched successfully', users);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
      const { id } = req.query;
      const { password } = req.body;
      const dto: UpdateUserDTO = {
        id: id as string,
        data: { password },
        userId: req.user.applicantId,
      };
      const updated = await this.service.update(dto);
      successResponse(res, 200, 'User updated successfully', updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  transitionState = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error(ERROR_CODES.USER_NOT_FOUND);
      const { id } = req.params;
      const { current, next } = req.body;
      const dto: TransitionRequestDto = {
        id: String(id),
        current: current,
        next: next,
        applicantId: req.user.applicantId,
      };
      const updated = await this.service.transitionState(dto);
      successResponse(res, 200, "User status updated successfully", updated);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) throw new Error(ERROR_CODES.UNAUTHORIZED);
      const { id } = req.params;
      const dto: DeleteDto = {
        id: id,
        applicantId: req.user.applicantId,
      };
      const deleted = await this.service.delete(dto);
      successResponse(res, 200, 'User deleted successfully', deleted);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };
}
