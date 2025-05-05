import { MyService } from "./MyService";

const end_point = '/auth/';

export const AuthService = {
    async loginUser(credentials: { user_name: string; password: string }): Promise<any> {
        const loggedInData = await MyService.post(end_point, credentials);
        const {token, user} = loggedInData;
        return  {token, user};
    }
};
