import { ApiClient } from "@/api/ApiClient";
import { sanitizeUser, User, UserStatus } from "../models/user.model";

const end_point = '/users';
const login_end_point = '/users/login';
const change_password_end_point = '/users/change-password';
const send_verification_code_end_point = '/users/send-verification-code';
const reset_password_end_point = '/users/reset-password';
const activate_user_end_point = '/users/activate-user';
const tokenStorage = 'authToken';
const userStorage = 'authUser';

export const UserApi = {

    async create(user: Partial<User>): Promise<User> {
        const sanitized = sanitizeUser(user);
        const created = await ApiClient.post(end_point, sanitized);
        return created as User;
    },

    async getUsers(showDeleted: boolean = false): Promise<User[]> {
        const data = await ApiClient.get(end_point);
        return data as User[];
    },

    async update(id: string, user: Partial<User>): Promise<User> {
        const query = new URLSearchParams();
        query.append("id", id);
        const sanitized = sanitizeUser(user);
        const updated = await ApiClient.put(`${end_point}?${query.toString()}`, sanitized);
        return updated as User;
    },

    async updateStatus(id: string, status: UserStatus): Promise<User> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${status}`;
        const updated = await ApiClient.put(`${url}?${query.toString()}`);
        return updated;
    },

    /*
    async updateUser(user: Partial<User>, changeStatus = false): Promise<User> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = changeStatus
            ? `${end_point}${user._id}/status`
            : `${end_point}${user._id}`;
        //const url = `${end_point}${user._id}`;
        const sanitized = sanitizeUser(user);
        const updatedUser = await ApiClient.put(url, sanitized);
        return updatedUser as User;
    },
*/

    async delete(id: string): Promise<User> {
        const query = new URLSearchParams();
        query.append("id", id);
        const response = await ApiClient.delete(`${end_point}?${query.toString()}`);
        return response;
    },

    async changePassword(password: Partial<User>): Promise<any> {
        const result = await ApiClient.patch(change_password_end_point, password);
        return result;
    },

    ////////////////////////////////////////

    async loginUser(credentials: User): Promise<any> {
        const loggedInData = await ApiClient.post(login_end_point, credentials);
        const { token, user } = loggedInData;
        localStorage.setItem(tokenStorage, token);
        localStorage.setItem(userStorage, JSON.stringify(user));
        return user;
    },

    getLoggedInUser(): User | null {
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



    async sendVerificationCode(email: string): Promise<any> {
        const response = await ApiClient.post(send_verification_code_end_point, { email: email });
        return response;
    },

    async resetPassword(credential: Partial<User>): Promise<any> {
        if (!credential.resetCode) {
            throw new Error("verification code required.");
        }
        const response = await ApiClient.post(reset_password_end_point, credential);
        return response;
    },

    async activateUser(credential: Partial<User>): Promise<any> {
        if (!credential.resetCode) {
            throw new Error("verification code required.");
        }
        const response = await ApiClient.post(activate_user_end_point, credential);
        return response;
    },

};
