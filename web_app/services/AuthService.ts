import { MyService } from "./MyService";

const end_point = '/auth/';
const reset_end_point = '/auth/send-reset-code';

export const AuthService = {
    async loginUser(credentials: { user_name: string; password: string }): Promise<any> {
        const loggedInData = await MyService.post(end_point, credentials);
        const { token, user } = loggedInData;
        return { token, user };
    },

    async sendResetCode(email: string): Promise<any> {
        const response = await MyService.post(reset_end_point, { email: email });
        return response;
    }
};
