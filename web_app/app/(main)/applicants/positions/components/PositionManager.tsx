'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { PositionApi } from "../api/position.api";
import { Position, PositionType } from "../models/position.model";
import SavePositionDialog from "./SavePositionDialog";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";

interface PositionManagerProps {
    posType: PositionType;
    parent?: Position;
}

const PositionManager = ({ posType, parent }: PositionManagerProps) => {

    const emptyPosition: Position = {
        type: posType,
        name: "",
        parent,
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.POSITION.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.POSITION.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.POSITION.DELETE]);

    // CRUD hook
    const {
        items: positions,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Position>();

    const [position, setPosition] = useState<Position>(emptyPosition);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch positions */
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                setLoading(true);
                const data = await PositionApi.getPositions({
                    type: posType,
                    parent: parent
                });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch positions. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchPositions();
    }, []);

    /** Save callback */
    const onSaveComplete = (saved: Position) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete function */
    const deletePosition = async (row: Position) => {
        const ok = await PositionApi.delete(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns */
    const columns = [
        { header: "Name", field: "name" },
        //{ header: "Parent", body: (p: Position) => p.parent?._id ?? "-" }
    ];

    const expansionTemplate = (row: Position) => (
        <PositionManager posType={PositionType.rank} parent={row} />
    );

    return (
        <>
            <CrudManager
                headerTitle={`Manage ${posType}s`}
                itemName={posType}
                items={positions}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => {
                    setPosition({ ...emptyPosition });
                    setShowSaveDialog(true);
                }}
                onEdit={(row) => {
                    setPosition({ ...row });
                    setShowSaveDialog(true);
                }}
                onDelete={(row) =>
                    confirm.ask({
                        item: row.name,
                        onConfirmAsync: () => deletePosition(row)
                    })
                }
                rowExpansionTemplate={posType === PositionType.position ? expansionTemplate : undefined}
            //enableSearch
            />

            {/* Save Position Dialog */}
            {(position && showSaveDialog) && (
                <SavePositionDialog
                    visible={showSaveDialog}
                    position={position}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default PositionManager;
