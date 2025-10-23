import { UserStatus } from "../user.enum";

export default interface JwtPayload {
  _id: string;
  //email?: string;
  user_name: string;
  status: UserStatus;
  iat?: number;
  exp?: number;
}