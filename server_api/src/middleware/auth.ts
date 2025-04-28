import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  _id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.split(' ')[1]; // Get token from "Bearer <token>"

  if (!token) {
    res.status(403).json({ message: "Unauthorized" });
    return; // Prevent further code execution
  }

  try {
    const decoded = jwt.verify(token, process.env.KEY as string) as JwtPayload;
    req.user = decoded;
    next();  // Continue to the next middleware or route handler
  } catch (error) {
    res.status(403).json({ message: "Invalid token, Logout and Login Again Please" });
  }
};
