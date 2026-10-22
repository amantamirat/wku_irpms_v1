'use client';

import { ColumnProps } from "primereact/column";
import { ItemManager } from "@/components/ItemManager";
import { useToast } from "@/contexts/ToastContext";
import { AccountApi } from "../api/account.api";
import { Account } from "../models/account.model";
import { ACCOUNT_TRANSITIONS } from "../models/account.state-machine";
import AccountForm from "./AccountForm";
import MyBadge from "@/templates/MyBadge";
import { MENU_ICONS } from "@/utils/menu-icons";

// Defined outside the component so references stay stable between renders
const columns: ColumnProps[] = [
    { header: "Email", field: "email", sortable: true },
    { header: "Name", field: "user.name", sortable: true },
    { header: "Last Seen", field: "lastLogin", sortable: true },
    {
        header: "Status",
        field: "status",
        body: (u: Account) => <MyBadge type="status" value={u.status ?? "Unknown"} />
    },
];

// Keep the linked user object the user picked: the API response may not echo populated fields back
const mapSaved = (saved: Account, submitted: Partial<Account>): Account => ({
    ...saved,
    user: submitted.user ?? saved.user,
});

export default function AccountManager() {
    const toast = useToast();

    return (
        <ItemManager<Account>
            api={AccountApi}
            resource="account"
            itemName="Account"
            headerTitle="Manage Accounts"
            itemIcon={MENU_ICONS.accounts}
            columns={columns}
            mapSaved={mapSaved}
            statusField="status"
            transitions={ACCOUNT_TRANSITIONS}
            dialogWidth="450px"
            renderForm={(props) => <AccountForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(operation === "create" ? "Account created" : "Account updated")
            }
        />
    );
}