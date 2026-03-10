import { createEntityManager } from "@/components/createEntityManager";
import { createEmptyGrant, Grant } from "../models/grant.model";
import SaveDialog from "./SaveDialog";
import GrantDetail from "./GrantDetail";
import { GrantApi } from "../api/grant.api";



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
    ],
    createNew: createEmptyGrant,
    SaveDialog,
    permissionPrefix: "grant",
    expandable: {
        template: (grant) => (
            <GrantDetail grant={grant} />
        )
    }
})