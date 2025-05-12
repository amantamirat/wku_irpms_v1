import { MyService } from "./MyService";

const end_point = '/auth/';
const send_rest_code_end_point = '/auth/send-reset-code';
const reset_password_end_point = '/auth/reset-password';
const send_activation_code_end_point = '/auth/send-activation-code';
const activate_account_end_point = '/auth/activate-account';

export const AuthService = {
    async loginUser(credentials: { user_name: string; password: string }): Promise<any> {
        const loggedInData = await MyService.post(end_point, credentials);
        const { token, user } = loggedInData;
        return { token, user };
    },

    async sendResetCode(email: string): Promise<any> {
        const response = await MyService.post(send_rest_code_end_point, { email: email });
        return response;
    },

    async resetPassword(email: string, resetCode: string, password: string): Promise<any> {
        const response = await MyService.post(reset_password_end_point, { email: email, resetCode: resetCode, password: password });
        return response;
    },

    async sendActivationCode(): Promise<any> {
        const response = await MyService.post(send_activation_code_end_point, {});
        return response;
    },

    async activateAccount(activationCode: string): Promise<any> {
        const response = await MyService.post(activate_account_end_point, { activationCode: activationCode });
        return response;
    },
};
