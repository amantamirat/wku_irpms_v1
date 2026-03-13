import { createEntityManager } from "@/components/createEntityManager";

import { createEmptyUser, User } from "../models/user.model";
import { UserApi } from "../api/user.api";
import MyBadge from "@/templates/MyBadge";
import { USER_STATUS_ORDER, USER_TRANSITIONS } from "../models/user.state-machine";
import SaveUser from "./SaveUser";



export default createEntityManager<User>({
    title: "Manage Accounts",
    itemName: "Account",
    api: UserApi,
    columns: [
        { header: "Email", field: "email" },
        { header: "Name", field: "applicant.name" },
        { header: "Last Seen", field: "lastLogin" },
        {
            header: "Status",
            field: "status",
            body: (u: User) => <MyBadge type="status" value={u.status ?? "Unknown"} />
        },
    ],
    createNew: createEmptyUser,
    SaveDialog: SaveUser,
    workflow: {
        statusField: "status",
        transitions: USER_TRANSITIONS,
        statusOrder: USER_STATUS_ORDER
    },
    permissionPrefix: "user"
})