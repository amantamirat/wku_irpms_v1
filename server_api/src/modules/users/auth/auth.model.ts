import { UserStatus } from "../enums/status.enum";

export default interface JwtPayload {
  email?: string;
  user_name: string;
  status: UserStatus;
  linkedApplicant?: any;
  roles?: any;
  iat?: number;
  exp?: number;
}