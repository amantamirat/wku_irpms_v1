'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Thematic, GetThematicsOptions, createEmptyThematic } from "../models/thematic.model";
import { ThematicApi } from "../api/thematic.api";
import SaveThematic from "./SaveThematic";
import { Organization } from "../../organizations/models/organization.model";
import ThematicDetail from "./ThematicDetail";
import { THEMATIC_STATUS_ORDER, THEMATIC_TRANSITIONS } from "../models/thematic.state-machine";
import MyBadge from "@/templates/MyBadge";


interface ThematicManagerProps {
    directorate?: Organization;
}

const ThematicManager = ({ directorate }: ThematicManagerProps) => {
    const Manager = createEntityManager<Thematic, GetThematicsOptions | undefined>({
        title: "Manage Thematics",
        itemName: "Thematic",
        api: ThematicApi,

        columns: [
            {
                header: "Directorate",
                field: "directorate",
                sortable: true,
                body: (r: Thematic) =>
                    typeof r.directorate === "object" ? r.directorate?.name : r.directorate
            },
            { header: "Title", field: "title", sortable: true },
            {
                header: "Level",
                field: "level",
                sortable: true,
                style: { width: '150px' }
            },
            { header: "Description", field: "description" },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (t: Thematic) =>
                    <MyBadge type="status" value={t.status ?? "Unknown"} />
            }
        ],
        createNew: () => createEmptyThematic(),
        SaveDialog: SaveThematic,
        permissionPrefix: "thematic",
        // Use this if your backend needs to join the Directorate object
        query: () => ({
            directorate: directorate ?? undefined,
            populate: true
        }),
        expandable: {
            template: (thematic) => (
                <div className="p-3">
                    <strong>Details for {thematic.title}:</strong>
                    <p>{thematic.description || 'No description provided.'}</p>
                    <ThematicDetail thematic={thematic} />
                </div>
            )
        },
        workflow: {
            statusField: "status",
            transitions: THEMATIC_TRANSITIONS,
            statusOrder: THEMATIC_STATUS_ORDER
        },

    });

    return <Manager />;
};

export default ThematicManager;