import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Unit } from '../../common/constants/enums';
import { Action } from '../../common/constants/permissions';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { AppError } from '../../common/errors/app.error';
import { errorResponse } from '../../common/helpers/response';
import { checkPermission } from '../../core/container';

import { AccountStatus } from '../accounts/account.model';
import JwtPayload from './auth.dto';

dotenv.config();

export interface AuthenticatedRequest extends Request {
  auth?: JwtPayload;
}

export const verifyActiveAccount = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access denied. Authentication token is required.',
        new AppError(ERROR_CODES.TOKEN_MISSING));
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return errorResponse(res, 401, 'Access denied. Authentication token is required.',
        new AppError(ERROR_CODES.TOKEN_MISSING));
    }

    const decoded = jwt.verify(token, process.env.KEY as string) as JwtPayload;

    if (decoded.status !== AccountStatus.active) {
      return errorResponse(res, 403, 'Account is not active. Please activate or contact admin.',
        new AppError(ERROR_CODES.ACCOUNT_NOT_ACTIVE));
    }

    req.auth = decoded;
    next();

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired. Please log in again.', new AppError(ERROR_CODES.TOKEN_EXPIRED));
    }
    return errorResponse(res, 401, 'Invalid token. Please log in again.', new AppError(ERROR_CODES.TOKEN_INVALID));
  }
};


export function checkUnitPermission(action: Action) {
  return (req: Request, res: Response, next: NextFunction) => {
    const unitInput = req.body?.type ?? req.query?.type ?? req.params?.type;

    const unit = unitInput as Unit;

    if (!Object.values(Unit).includes(unit)) {
      return errorResponse(
        res,
        400,
        'Invalid or missing unit type',
        new AppError(ERROR_CODES.INVALID_UNIT)
      );
    }

    const permission = `organization:${unit}:${action}`;

    return checkPermission(permission)(req, res, next);
  };
}