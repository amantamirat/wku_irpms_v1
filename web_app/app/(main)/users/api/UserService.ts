import { ApiClient } from "@/api/ApiClient";
import { sanitizeUser, User } from "../models/user.model";

const end_point = '/users/';
const tokenStorage = 'authToken';
const userStorage = 'authUser';

export const UserApi = {

    async getUsers(showDeleted: boolean = false): Promise<User[]> {
        const data = await ApiClient.get(`${end_point}?showDeleted=${String(showDeleted)}`);
        return data as User[];
    },

    async createUser(user: Partial<User>): Promise<User> {
        const sanitized = sanitizeUser(user);
        const created = await ApiClient.post(end_point, sanitized);
        return created as User;
    },

    async loginUser(credentials: User): Promise<any> {
        const loggedInData = await ApiClient.post(`${end_point}login`, credentials);
        console.log(`${end_point}login`);
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

    logout() {
        localStorage.removeItem(tokenStorage);
        localStorage.removeItem(userStorage);
        //router.push('/auth/login');
    },

    getToken(): string | null {
        const tokenInfo = localStorage.getItem(tokenStorage);
        if (tokenInfo) {
            return tokenInfo
        }
        return null;
    },

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

    async deleteUser(user: User): Promise<User> {
        if (!user._id) {
            throw new Error("_id required.");
        }
        const url = `${end_point}${user._id}`;
        const response = await ApiClient.delete(url);
        return response;
    },

    async changePassword(password: Partial<User>): Promise<any> {
        const url = `${end_point}${password._id}/change-password`;
        const result = await ApiClient.patch(url, password);
        return result;
    },

};
