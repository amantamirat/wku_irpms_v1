import { MyService } from "./MyService";

const end_point = '/auth/';

export const AuthService = {
    async loginUser(credentials: { user_name: string; password: string }): Promise<boolean> {
        const loggedInData = await MyService.post(end_point, credentials);
        localStorage.setItem('authToken', loggedInData.token);
        return true;
    },
    logoutUser(): void {
        localStorage.removeItem('authToken');
    }
};
