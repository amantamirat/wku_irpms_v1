import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CacheService } from '../../util/cache/cache.service';
import { errorResponse } from '../../common/helpers/response';
import { UserStatus } from './user.enum';
import JwtPayload from './user.dto';

dotenv.config();

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const verifyActiveAccount = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return errorResponse(res, 401, "Access denied. Token missing or invalid.");
    }

    const decoded = jwt.verify(token, process.env.KEY as string) as JwtPayload;

    if (decoded.status !== UserStatus.active) {
      return errorResponse(res, 403, "Account is not active. Please activate or contact admin.");
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, "Session expired. Please log in again.", { code: "TOKEN_EXPIRED" });
    } else {
      //console.log("Token verification error:", error);
      return errorResponse(res, 401, "Invalid token. Please log in again.", { code: "TOKEN_INVALID" });
    }
  }
};


export const checkPermission = (requiredPermission: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, "Unauthorized. No user in request.");
      }
      const userId = req.user._id;
      const hasPermission = await CacheService.hasPermissions(userId, requiredPermission);
      if (!hasPermission) {
        return errorResponse(res, 403, `Forbidden. ${requiredPermission}, Permission missing.`);
      }
      next();
    } catch (err) {
      console.error("Permission check failed:", err);
      return errorResponse(res, 500, "Internal server error during permission check.");
    }
  };
};


export const checkStatusPermission = (resource: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, "Unauthorized");
      }
      const status = req.params.status;
      const permission = `${resource}:status.${status}`;
      const hasPermission = await CacheService.hasPermissions(
        req.user._id,
        [permission]
      );
      if (!hasPermission) {
        return errorResponse(res, 403, `Forbidden. Missing permission: ${permission}`
        );
      }
      next();
    } catch (err) {
      return errorResponse(res, 500, "Permission check failed");
    }
  };
}




