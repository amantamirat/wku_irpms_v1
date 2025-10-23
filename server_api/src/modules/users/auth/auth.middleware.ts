import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { errorResponse } from '../../../util/response';
import { UserStatus } from '../user.enum';
import JwtPayload from './auth.model';
import { Role } from '../roles/role.model';

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
      console.log("Token verification error:", error);
      return errorResponse(res, 401, "Invalid token. Please log in again.", { code: "TOKEN_INVALID" });
    }
  }
};


export const checkPermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, "Unauthorized. No user in request.");
      }

      const roleIds = req.user.roles?.map((r: any) => r._id || r);
      if (!roleIds?.length) {
        return errorResponse(res, 403, "Access denied. User has no assigned roles.");
      }

      // Fetch roles with their permissions
      const roles = await Role.find({ _id: { $in: roleIds } }).populate("permissions");

      // Flatten all permission names
      const userPermissions = roles.flatMap((r) =>
        r.permissions.map((p: any) => p.name)
      );

      // Check if the required permission exists
      if (!userPermissions.includes(requiredPermission)) {
        return errorResponse(res, 403, "Access denied. Permission missing.");
      }

      next();
    } catch (err) {
      console.error("Permission check failed:", err);
      return errorResponse(res, 500, "Internal server error during permission check.");
    }
  };
};

