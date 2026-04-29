import { ApiClient } from "@/api/ApiClient";
import { Account } from "@/app/(main)/accounts/models/account.model";
import { ChangePasswordDTO, LoginDto } from "../dto/auth.dto";



const login_end_point = '/auth/login';
const change_password_end_point = '/auth/change-password';
const send_verification_code_end_point = '/auth/send-verification-code';
const reset_password_end_point = '/auth/reset-password';
const activate_user_end_point = '/auth/activate-user';
const tokenStorage = 'authToken';
const userStorage = 'authUser';

export const AuthApi = {

    async loginUser(credentials: LoginDto): Promise<any> {
        const userIfo = await ApiClient.post(login_end_point, credentials);
        const { token, user } = userIfo;
        localStorage.setItem(tokenStorage, token);
        localStorage.setItem(userStorage, JSON.stringify(user));
        return user;
    },

    getLoggedInUser(): any | null {
        const userInfo = localStorage.getItem(userStorage);
        if (userInfo) {
            return JSON.parse(userInfo);
        }
        return null;
    },

    getToken(): string | null {
        const tokenInfo = localStorage.getItem(tokenStorage);
        if (tokenInfo) {
            return tokenInfo
        }
        return null;
    },

    logout() {
        localStorage.removeItem(tokenStorage);
        localStorage.removeItem(userStorage);
        //router.push('/auth/login');
    },

    async changePassword(dto: ChangePasswordDTO): Promise<any> {
        const response = await ApiClient.post(change_password_end_point, dto);
        return response;
    },

    async sendVerificationCode(email: string): Promise<any> {
        const response = await ApiClient.post(send_verification_code_end_point, { email: email });
        return response;
    },

    async resetPassword(credential: Partial<Account>): Promise<any> {
        if (!credential.resetCode) {
            throw new Error("verification code required.");
        }
        const response = await ApiClient.post(reset_password_end_point, credential);
        return response;
    },

    async activateUser(credential: Partial<Account>): Promise<any> {
        if (!credential.resetCode) {
            throw new Error("verification code required.");
        }
        const response = await ApiClient.post(activate_user_end_point, credential);
        return response;
    },

};
