import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../util/response";
import { AuthService, LoginUserDto, VerfyUserDto } from "./auth.service";


export class AuthController {

    static async logInUser(req: Request, res: Response) {
        try {
            const data: LoginUserDto = req.body;
            const loggedInUser = await AuthService.loginUser(data);
            successResponse(res, 201, "User logged in successfully", loggedInUser);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async sendVerificationCode(req: Request, res: Response) {
        try {
            const data = req.body.email;
            await AuthService.sendVerificationCode(data);
            successResponse(res, 200, 'Verfification code sent to email.', { success: true });
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async resetUser(req: Request, res: Response) {
        try {
            const data: VerfyUserDto = req.body;
            await AuthService.resetPassword(data);
            successResponse(res, 201, "Password resetted successfully", { success: true });
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    static async activateUser(req: Request, res: Response) {
        try {
            const data: VerfyUserDto = req.body;
            await AuthService.activateUser(data);
            successResponse(res, 201, "User activated successfully", { success: true });
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}