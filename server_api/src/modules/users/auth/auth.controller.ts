import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../../util/response";
import { AuthService, LoginUserDto } from "./auth.service";


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
}