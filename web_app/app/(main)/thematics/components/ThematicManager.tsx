'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Thematic, GetThematicsOptions, createEmptyThematic } from "../models/thematic.model";
import { ThematicApi } from "../api/thematic.api";
import SaveThematic from "./SaveThematic";
import ThematicDetail from "./ThematicDetail";
import { THEMATIC_STATUS_ORDER, THEMATIC_TRANSITIONS } from "../models/thematic.state-machine";
import MyBadge from "@/templates/MyBadge";


interface ThematicManagerProps {
    // directorate?: Organization;
    populate?: boolean;
}

const ThematicManager = ({ populate }: ThematicManagerProps) => {
    const Manager = createEntityManager<Thematic, GetThematicsOptions | undefined>({
        title: "Manage Thematics",
        itemName: "Thematic",
        api: ThematicApi,

        columns: [
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
        expandable: {
            template: (thematic) => (
                <ThematicDetail thematic={thematic} />
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