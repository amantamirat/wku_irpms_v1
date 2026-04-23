'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { useAuth } from "@/contexts/auth-context";
import { PositionApi } from "../api/position.api";
import { createEmptyPosition, Position, PositionType } from "../models/position.model";
import SavePositionDialog from "./SavePosition";

interface PositionManagerProps {
    posType: PositionType;
    parent?: Position;
}

const PositionManager = ({ posType, parent }: PositionManagerProps) => {

    const { hasPermission } = useAuth();

    const Manager = createEntityManager<Position, any>({
        title: `Manage ${posType}s`,
        itemName: posType,
        api: PositionApi,

        columns: [
            { header: "Name", field: "name" },
            // optional:
            // { header: "Parent", body: (p: Position) => p.parent?._id ?? "-" }
        ],

        /** Create empty */
        createNew: () =>
            createEmptyPosition(posType, parent?._id),

        /** Save dialog */
        SaveDialog: SavePositionDialog,

        /** Permissions */
        permissionPrefix: "position", // assumes your system maps this internally

        /** Query */
        query: () => ({
            type: posType,
            parent: parent?._id
        }),

        /** Expansion (recursive manager) */
        expandable: posType === PositionType.position
            ? {
                template: (row: Position) => (
                    <PositionManager
                        posType={PositionType.rank}
                        parent={row}   // ✅ IMPORTANT: pass full position as parent
                    />
                )
            }
            : undefined,
    });

    return <Manager />;
};

export default PositionManager;