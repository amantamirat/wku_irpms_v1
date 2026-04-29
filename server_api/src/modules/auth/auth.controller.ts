import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../common/helpers/response";
import { VerfyAccountDto } from '../accounts/account.dto';
import { AuthenticatedRequest } from "./auth.middleware";
import { AuthService } from "./auth.service";
import { ChangePasswordDTO, LoginDto } from "./auth.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

export class AuthController {

  constructor(private readonly service: AuthService) { }

  login = async (req: Request, res: Response) => {
    try {
      const data: LoginDto = req.body;
      const loggedInUser = await this.service.login(data);
      successResponse(res, 200, "User logged in successfully", loggedInUser);
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.auth) throw new AppError(ERROR_CODES.UNAUTHORIZED);
      const { currentPassword, password } = req.body;
      const dto: ChangePasswordDTO = {
        id: req.auth.accountId ?? "",
        data: { currentPassword, password }
      };
      await this.service.changePassword(dto);
      successResponse(res, 200, "Password changed successfully", { success: true });
    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  

  sendVerificationCode = async (req: Request, res: Response) => {
    try {

      const { email } = req.body;

      await this.service.sendCode(email);

      successResponse(res, 200, "Verification code sent to email.", { success: true });

    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {

      const data: VerfyAccountDto = req.body;

      await this.service.resetPassword(data);

      successResponse(res, 200, "Password reset successfully", { success: true });

    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

  activateUser = async (req: Request, res: Response) => {
    try {

      const data: VerfyAccountDto = req.body;

      await this.service.activateUser(data);

      successResponse(res, 200, "User activated successfully", { success: true });

    } catch (err: any) {
      errorResponse(res, 400, err.message, err);
    }
  };

}