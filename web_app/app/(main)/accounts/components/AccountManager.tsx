import { createEmptyAccount, Account } from "../models/account.model";
import { AccountApi } from "../api/account.api";
import MyBadge from "@/templates/MyBadge";
import { ACCOUNT_TRANSITIONS } from "../models/account.state-machine";
import SaveAccount from "./SaveAccount";
import { createEntityManager } from "@/components/data-table/createEntityManager";

export default createEntityManager<Account>({
    title: "Manage Accounts",
    itemName: "Account",
    api: AccountApi,
    columns: [
        { header: "Email", field: "email" },
        { header: "Name", field: "user.name" },
        { header: "Last Seen", field: "lastLogin" },
        {
            header: "Status",
            field: "status",
            body: (u: Account) => <MyBadge type="status" value={u.status ?? "Unknown"} />
        },
    ],
    createNew: createEmptyAccount,
    SaveDialog: SaveAccount,
    workflow: {
        statusField: "status",
        transitions: ACCOUNT_TRANSITIONS,
    },
    permissionPrefix: "account"
})