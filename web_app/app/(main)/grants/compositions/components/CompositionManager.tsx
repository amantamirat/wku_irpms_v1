'use client';

import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { useEffect, useState } from "react";

import { Composition } from "../models/composition.model";
import { CompositionApi } from "../api/composition.api";
import SaveDialog from "./SaveDialog";
import { Grant } from "../../models/grant.model";


interface CompositionManagerProps {
    grant: Grant;
}

const CompositionManager = ({ grant }: CompositionManagerProps) => {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const emptyComposition: Composition = {
        grant,
        title: "",
        minCount: 1,
        isPI: false
    };

    // ✅ Permissions
    const canCreate = hasPermission([PERMISSIONS.COMPOSITION.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.COMPOSITION.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.COMPOSITION.DELETE]);

    // ✅ CRUD hook
    const {
        items: compositions,
        updateItem,
        removeItem,
        setAll,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Composition>();

    const [composition, setComposition] = useState<Composition>(emptyComposition);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // ✅ Fetch compositions by grant
    useEffect(() => {
        if (!grant?._id) return;

        const fetchCompositions = async () => {
            try {
                setLoading(true);
                const data = await CompositionApi.getCompositions({ grant: grant });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch compositions. " + (err.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchCompositions();
    }, [grant]);

    // ✅ Save complete
    const onSaveComplete = (saved: Composition) => {
        updateItem(saved);
        hideSaveDialog();
    };

    const deleteComposition = async (row: Composition) => {
        const deleted = await CompositionApi.deleteComposition(row);
        if (deleted) removeItem(row);
    };

    const hideSaveDialog = () => {
        setComposition(emptyComposition);
        setShowSaveDialog(false);
    };

    // ✅ Only Title Column (clean UI)
    const columns = [
        { 
            field: "title", 
            header: "Title", 
            sortable: true,
            body: (rowData: Composition) => (
                <>
                    {rowData.title}
                    {rowData.isPI && (
                        <span style={{ marginLeft: 8, color: "var(--primary-color)" }}>
                            (PI)
                        </span>
                    )}
                </>
            )
        }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Compositions"
                items={compositions}
                dataKey="_id"
                columns={columns}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onCreate={() => { setComposition(emptyComposition); setShowSaveDialog(true); }}
                onEdit={(row) => { setComposition(row); setShowSaveDialog(true); }}
                onDelete={(row) => confirm.ask({ item: row.title, onConfirmAsync: () => deleteComposition(row) })}
            />

            {(composition && showSaveDialog) && (
                <SaveDialog
                    visible={showSaveDialog}
                    composition={composition}
                    onComplete={onSaveComplete}
                    onHide={() => setShowSaveDialog(false)}
                />
            )}
        </>
    );
};

export default CompositionManager;
