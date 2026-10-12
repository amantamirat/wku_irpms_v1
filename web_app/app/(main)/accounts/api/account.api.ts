import { ApiClient } from "@/api/ApiClient";
import { Account, AccountStatus } from "../models/account.model";
import { EntityApi } from "@/api/EntityApi";
import { StateTransition } from "@/api/EntityApi";
import { sanitize } from "@/utils/utils";

const end_point = '/accounts';


export const AccountApi: EntityApi<Account> = {

    async create(account: Partial<Account>): Promise<Account> {
        const sanitized = sanitize(account);
        const created = await ApiClient.post(end_point, sanitized);
        return created as Account;
    },

    async getAll(): Promise<Account[]> {
        const data = await ApiClient.get(end_point);
        return data as Account[];
    },

    async update(account: Partial<Account>) {
        if (!account._id) throw new Error("_id required")
        const sanitized = sanitize(account);
        //console.log("account", account, "id", account._id);
        return ApiClient.put(`${end_point}/${account._id}`, sanitized)
    },

    async transitionState(id: string, dto: StateTransition): Promise<any> {
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
