'use client';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import { PositionApi } from "../api/position.api";
import { createEmptyPosition, FilterPositionOptions, Position } from "../models/position.model";
import SavePositionDialog from "./SavePosition";

const PositionManager = () => {   

    const Manager = createEntityManager<Position, FilterPositionOptions>({
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