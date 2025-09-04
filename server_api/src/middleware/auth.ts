import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { errorResponse } from '../util/response';
import { UserStatus } from '../modules/users/enums/status.enum';

dotenv.config();

export interface JwtPayload {
  email: string;
  user_name: string;
  status: UserStatus;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      errorResponse(res, 401, "Access denied. Token missing or invalid.");
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.KEY as string) as JwtPayload;
      req.user = decoded;
      next();
    } catch (verifyError: any) {
      console.log("Token verification error:", verifyError);
      if (verifyError.name === 'TokenExpiredError') {
        errorResponse(res, 401, "Session expired. Please log in again.", { code: "TOKEN_EXPIRED" });
      } else {
        errorResponse(res, 401, "Invalid token. Please log in again.", { code: "TOKEN_INVALID" });
      }
    }
  } catch (outerError: any) {
    console.log("Unexpected outer error in authenticateToken:", outerError);
    errorResponse(res, 500, "Unexpected error during token authentication.");
  }
};


export const verifyActiveAccount = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      errorResponse(res, 401, "Access denied. Token missing or invalid.", {});
      return;
    }
    const decoded = jwt.verify(token, process.env.KEY as string) as JwtPayload;
    if (decoded.status !== UserStatus.Active) {
      errorResponse(res, 403, "Account is not active. Please activate or contact admin.", {});
      return;
    }
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      errorResponse(res, 401, "Session expired. Please log in again.");
    } else {
      console.log(error);
      errorResponse(res, 401, "Invalid token. Please log in again.", error);
    }
  }
};
