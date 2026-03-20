'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { GrantApi } from "../api/grant.api";
import { createEmptyGrant, GetGrantOptions, Grant } from "../models/grant.model";
import { GRANT_STATUS_ORDER, GRANT_TRANSITIONS } from "../models/grant.state-machine";
import GrantDetail from "./GrantDetail";
import SaveGrant from "./SaveGrant";
import MyBadge from "@/templates/MyBadge";
import { Organization } from "../../organizations/models/organization.model";
import { Thematic } from "../../thematics/models/thematic.model";

interface GrantManagerProps {
    organization?: Organization;
    thematic?: Thematic;
}

const GrantManager = ({ organization, thematic }: GrantManagerProps) => {

    const Manager = createEntityManager<Grant, GetGrantOptions | undefined>({
        title: "Manage Grants",
        itemName: "Grant",
        api: GrantApi,

        columns: [
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
            ...(!thematic ? [{
                header: "Thematic",
                field: "thematic.name",
                body: (g: Grant) =>
                    typeof g.thematic === "object"
                        ? g.thematic?.title
                        : g.thematic,
                sortable: true
            }] : []),
            {
                header: "Amount",
                field: "amount",
                sortable: true,
                body: (rowData: Grant) =>
                    rowData.amount?.toLocaleString()
            },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (g: Grant) =>
                    <MyBadge type="status" value={g.status ?? 'Unknown'} />
            },
        ],

        createNew: () =>
            createEmptyGrant({
                organization,
                thematic
            }),

        SaveDialog: SaveGrant,
        permissionPrefix: "grant",

        query: () => ({
            organization: organization ?? undefined,
            thematic: thematic ?? undefined,
            populate: true,
        }),

        expandable: {
            template: (grant) => (
                <GrantDetail grant={grant} />
            )
        },

        workflow: {
            statusField: "status",
            transitions: GRANT_TRANSITIONS,
            statusOrder: GRANT_STATUS_ORDER
        }
    });

    return <Manager />;
};

export default GrantManager;