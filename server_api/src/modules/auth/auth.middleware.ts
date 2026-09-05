import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../../common/helpers/response';
import JwtPayload from './auth.dto';
import { AccountStatus } from '../accounts/account.model';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { Action } from '../../common/constants/permissions';
import { Unit } from '../../common/constants/enums';
import { AuthPermissionService } from './auth.permission-service';
import { checkPermission } from '../../core/container';

dotenv.config();

export interface AuthenticatedRequest extends Request {
  auth?: JwtPayload;
}
export const verifyActiveAccount = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, "Access denied. Authentication token is required.",
        { code: "TOKEN_MISSING" });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return errorResponse(res, 401, "Access denied. Authentication token is required.",
        { code: "TOKEN_MISSING" });
    }

    const decoded = jwt.verify(token, process.env.KEY as string) as JwtPayload;

    if (decoded.status !== AccountStatus.active) {
      return errorResponse(res, 403, "Account is not active. Please activate or contact admin.",
        { code: ERROR_CODES.ACCOUNT_NOT_ACTIVE });
    }

    req.auth = decoded;
    next();

  } catch (error: any) {

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, "Token expired. Please log in again.",
        { code: "TOKEN_EXPIRED" });
    }

    return errorResponse(res, 401, "Invalid token. Please log in again.",
      { code: "TOKEN_INVALID" });
  }
};


export function checkUnitPermission(action: Action) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract unit type from body or query
    const unitInput = req.body.type || req.query.type || req.params.type;
    const unit = unitInput as Unit;

    // Validate unit type
    if (!Object.values(Unit).includes(unit)) {
      return errorResponse(res, 400, "Invalid or missing unit type");
    }
    const permission = `organization:${unit}:${action}`;
    return checkPermission(permission)(req, res, next);
  };
}


