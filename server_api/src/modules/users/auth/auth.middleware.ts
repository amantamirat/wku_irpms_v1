import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { AuthStatus } from './auth.status';
import JwtPayload from './auth.dto';
import { errorResponse } from '../../../common/helpers/response';
import { CacheService } from '../../../util/cache/cache.service';

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

    if (decoded.status !== AuthStatus.active) {
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
      const userId = req.user.userId;
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
      let status = req.params.status;
      if (!status) {
        status = req.body.status;
      }
      if (!status) {
        return errorResponse(res, 400, "Status not provided");
      }
      const permission = `${resource}:status.${status}`;
      const hasPermission = await CacheService.hasPermissions(req.user.userId, [permission]);
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


export const checkTransitionPermission = (resource: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    nextMiddleware: NextFunction
  ) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, "Unauthorized");
      }

      const { current, next } = req.body;

      if (!current || !next) {
        return errorResponse(
          res,
          400,
          "Transition requires 'current' and 'next' status"
        );
      }

      const permission =
        `${resource}:transition.${current}.${next}`;

      const hasPermission =
        await CacheService.hasPermissions(
          req.user.userId,
          [permission]
        );

      if (!hasPermission) {
        return errorResponse(
          res,
          403,
          `Forbidden. Missing permission: ${permission}`
        );
      }

      nextMiddleware();
    } catch (err) {
      return errorResponse(res, 500, "Permission check failed");
    }
  };
};




