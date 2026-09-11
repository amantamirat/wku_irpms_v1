import { ApiClient } from "@/api/ApiClient";
import { Account } from "@/app/(main)/accounts/models/account.model";
import { ChangePasswordDTO, LoginDto, ActivateAccountDTO, ResetPasswordDto } from "../dto/auth.dto";

const login_end_point = '/auth/login';
const change_password_end_point = '/auth/change-password';
const send_verification_code_end_point = '/auth/send-code';
const reset_password_end_point = '/auth/reset-password';
const activate_user_end_point = '/auth/activate';

const tokenStorage = 'authToken';
const sessionStorage = 'authSession';

export const AuthApi = {

    async loginUser(credentials: LoginDto): Promise<any> {
        const response = await ApiClient.post(login_end_point, credentials);
        const { token, user, permissions, ownerships, status } = response;
        // store token
        localStorage.setItem(tokenStorage, token);
        // store user session info
        const session = {
            user, permissions, ownerships, status
        };
        localStorage.setItem(sessionStorage, JSON.stringify(session));
        return session;
    },

    getLoggedInUser(): any | null {
        const userInfo = localStorage.getItem(sessionStorage);
        if (userInfo) {
            return JSON.parse(userInfo);
        }
        return null;
    },

    getToken(): string | null {
        return localStorage.getItem(tokenStorage);
    },

    logout() {
        if (typeof window === "undefined") return;
        localStorage.removeItem(tokenStorage);
        localStorage.removeItem(sessionStorage);
        window.dispatchEvent(new Event("auth:logout"));
    },

    async changePassword(dto: ChangePasswordDTO): Promise<any> {
        return ApiClient.post(change_password_end_point, dto);
    },

    async sendVerificationCode(email: string): Promise<any> {
        return ApiClient.post(send_verification_code_end_point, { email });
    },

    async resetPassword(dto: ResetPasswordDto): Promise<any> {
        return ApiClient.post(reset_password_end_point, dto);
    },

    async activateUser(dto: ActivateAccountDTO): Promise<any> {
        return ApiClient.post(activate_user_end_point, dto);
    },
};