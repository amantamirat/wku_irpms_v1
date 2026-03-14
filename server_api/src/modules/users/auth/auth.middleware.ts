import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CacheService } from '../../../util/cache.service';
import { errorResponse } from '../../../common/helpers/response';
import JwtPayload from './auth.dto';
import { UserStatus } from '../user.state-machine';
import { ERROR_CODES } from '../../../common/errors/error.codes';
import { Action } from '../../../common/constants/permissions';
import { Unit } from '../../../common/constants/enums';

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


export const checkPermission = (requiredPermission: string | string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, ERROR_CODES.UNAUTHORIZED);
      }
      const userId = req.user.applicantId;

      // Normalize to array
      const permissions = Array.isArray(requiredPermission)
        ? requiredPermission
        : [requiredPermission];

      const hasPermission = CacheService.hasPermissions(userId, permissions);

      if (!hasPermission) {
        return errorResponse(
          res,
          403,
          `Forbidden. Missing permission: ${permissions.join(", ")}`
        );
      }

      next();
    } catch (err) {
      console.error("Permission check failed:", err);
      return errorResponse(
        res,
        500,
        "Internal server error during permission check."
      );
    }
  };
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

export const checkTransitionPermission = (resource: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    nextMiddleware: NextFunction
  ) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, ERROR_CODES.UNAUTHORIZED);
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
          req.user.applicantId,
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

//////////////////////
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
      const hasPermission = await CacheService.hasPermissions(req.user.applicantId, [permission]);
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







