import { createEntityManager } from "@/components/createEntityManager";
import { GrantApi } from "../api/grant.api";
import { createEmptyGrant, Grant } from "../models/grant.model";
import { GRANT_STATUS_ORDER, GRANT_TRANSITIONS } from "../models/grant.state-machine";
import GrantDetail from "./GrantDetail";
import SaveGrant from "./SaveGrant";
import MyBadge from "@/templates/MyBadge";

export default createEntityManager<Grant>({
    title: "Manage Grants",
    itemName: "Grant",
    api: GrantApi,
    columns: [
        //{ field: "fundingSource", header: "Source", sortable: true },
        {
            header: "Organization",
            field: "organization.name",
            body: (r: Grant) =>
                typeof r.organization === "object"
                    ? r.organization?.name
                    : r.organization,
            sortable: true
        },
        { header: "Title", field: "title" },
        { header: "Amount", field: "amount", sortable: true, body: (rowData: any) => rowData.amount.toLocaleString() },
        {
            field: "status", header: "Status", sortable: true,
            body: (g: Grant) =>
                <MyBadge type="status" value={g.status ?? 'Unknown'} />
        },
    ],
    createNew: createEmptyGrant,
    SaveDialog: SaveGrant,
    permissionPrefix: "grant",
    workflow: {
        statusField: "status",
        transitions: GRANT_TRANSITIONS,
        statusOrder: GRANT_STATUS_ORDER
    },
    expandable: {
        template: (grant) => (
            <GrantDetail grant={grant} />
        )
    }
})