'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import { PositionApi } from "../api/position.api";
import { createEmptyPosition, Position, GetPositionOptions } from "../models/position.model";
import SavePositionDialog from "./SavePosition";

const PositionManager = () => {
    const { hasPermission } = useAuth();

    const Manager = createEntityManager<Position, GetPositionOptions>({
        title: "Manage Positions",
        itemName: "Position",
        api: PositionApi,

        /* =========================
           Table Columns
        ========================= */
        columns: [
            { header: "Name", field: "name" }
        ],

        /* =========================
           Create Empty Item
        ========================= */
        createNew: () => createEmptyPosition(),

        /* =========================
           Dialog
        ========================= */
        SaveDialog: SavePositionDialog,

        /* =========================
           Permissions
        ========================= */
        permissionPrefix: "position"
    });

    return <Manager />;
};

export default PositionManager;