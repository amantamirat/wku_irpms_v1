import { ApiClient } from "@/api/ApiClient";
import { sanitizeAccount, Account, AccountStatus } from "../models/account.model";
import { EntityApi } from "@/api/EntityApi";
import { TransitionRequestDto } from "@/types/util";

const end_point = '/accounts';


export const AccountApi: EntityApi<Account> = {

    async create(account: Partial<Account>): Promise<Account> {
        const sanitized = sanitizeAccount(account);
        const created = await ApiClient.post(end_point, sanitized);
        return created as Account;
    },

    async getAll(): Promise<Account[]> {
        const data = await ApiClient.get(end_point);
        return data as Account[];
    },

    async update(account: Partial<Account>) {
        if (!account._id) throw new Error("_id required")
        const sanitized = sanitizeAccount(account);
        return ApiClient.put(`${end_point}/${account._id}`, sanitized)
    },

    async transitionState(id: string, dto: TransitionRequestDto): Promise<any> {
        const query = new URLSearchParams();
        query.append("id", id);
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    },

    async delete(account) {
        if (!account._id) throw new Error("_id required")
        return ApiClient.delete(`${end_point}/${account._id}`)
    }
};
