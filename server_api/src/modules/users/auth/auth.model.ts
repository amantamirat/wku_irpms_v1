import { UserStatus } from "../user.enum";

export default interface JwtPayload {
  _id: string;
  //email?: string;
  user_name: string;
  status: UserStatus;
  linkedApplicant?: any;
  //roles?: any;
  permissions?: string[];
  iat?: number;
  exp?: number;
}