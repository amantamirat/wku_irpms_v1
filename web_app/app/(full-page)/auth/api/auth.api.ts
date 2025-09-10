import { ApiClient } from "@/api/ApiClient";
import { LoginDto } from "@/app/(full-page)/auth/login/model/login.model";
import { User } from "@/app/(main)/users/models/user.model";
const end_point = '/auth/';
const send_verification_code_end_point = '/auth/send-verification-code';
const reset_password_end_point = '/auth/reset-password';
const activate_user_end_point = '/auth/activate-user';
const tokenStorage = 'authToken';
const userStorage = 'authUser';

export const AuthApi = {
    
    async loginUser(credentials: LoginDto): Promise<any> {
        const loggedInData = await ApiClient.post(end_point, credentials);
        const { token, user } = loggedInData;
        localStorage.setItem(tokenStorage, token);
        localStorage.setItem(userStorage, JSON.stringify(user));
        return user;
    },

    async sendVerificationCode(email: string): Promise<any> {
        const response = await ApiClient.post(send_verification_code_end_point, { email: email });
        return response;
    },

    async resetPassword(credential: Partial<User>): Promise<any> {
        if (!credential.reset_code) {
            throw new Error("verification code required.");
        }
        const response = await ApiClient.post(reset_password_end_point, credential);
        return response;
    },

    async activateUser(credential: Partial<User>): Promise<any> {
        if (!credential.reset_code) {
            throw new Error("verification code required.");
        }
        const response = await ApiClient.post(activate_user_end_point, credential);
        return response;
    }    
};
