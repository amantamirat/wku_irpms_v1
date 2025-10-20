import mongoose from "mongoose";
import { UserStatus } from "../user.enum";

export default interface JwtPayload {
  id: string;
  email?: string;
  user_name: string;
  status: UserStatus;
  linkedApplicant?: any;
  roles?: any;
  iat?: number;
  exp?: number;
}