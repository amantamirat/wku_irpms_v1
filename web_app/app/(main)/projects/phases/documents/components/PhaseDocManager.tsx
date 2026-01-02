'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { useCrudList } from "@/hooks/useCrudList";
import { PERMISSIONS } from "@/types/permissions";
import { Phase } from "../../models/phase.model";
import { PhaseDocType, PhaseDocument } from "../model/phase.doc";
import { PhaseDocApi } from "../api/phase.doc.api";

interface PhaseDocManagerProps {
    phase: string;
}

export default function PhaseDocManager({
    phase,
}: PhaseDocManagerProps) {

    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();


    const emptyPhaseDoc: PhaseDocument = {
        phase,
        type: PhaseDocType.report
    };

    // -------------------------------
    // Permissions
    // -------------------------------
    /*
    const isValidStatus = project.status === ProjectStatus.pending ||
        project.status === ProjectStatus.negotiation;*/
    const canCreate = true;
    const canEdit = true;
    const canDelete = true;

    // -------------------------------
    // CRUD Hook
    // -------------------------------
    const {
        items: projectThemes,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<PhaseDocument>();

    const [phaseDoc, setPhaseDoc] = useState<PhaseDocument>(emptyPhaseDoc);
    const [showDialog, setShowDialog] = useState(false);

    // -------------------------------
    // Fetch project themes
    // -------------------------------
    useEffect(() => {
        const fetchPhaseDocs = async () => {
            try {
                setLoading(true);
                const data = await PhaseDocApi.getPhaseDocs({ phase });
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch phase docs. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };

        fetchPhaseDocs();

    }, [phase]);

    // -------------------------------
    // Save / Create
    // -------------------------------
    const onSaveComplete = (saved: PhaseDocument) => {
        updateItem(saved);
        hideDialog();
    };

    // -------------------------------
    // Delete
    // -------------------------------
    const deletePhaseDoc = async (row: PhaseDocument) => {
        const deleted = await PhaseDocApi.delete(row);
        if (deleted) removeItem(row);
    };

    // -------------------------------
    // Helpers
    // -------------------------------
    const hideDialog = () => {
        setPhaseDoc(emptyPhaseDoc);
        setShowDialog(false);
    };

    const handleCreate = () => {
        setPhaseDoc(emptyPhaseDoc);
        setShowDialog(true);
    };

    const handleEdit = (row: PhaseDocument) => {
        setPhaseDoc(row);
        setShowDialog(true);
    };

    // -------------------------------
    // Table Columns
    // -------------------------------
    const columns = [
        {
            field: "type",
            header: "Type",
            sortable: true
        }
    ];

    return (
        <>
            <CrudManager
                headerTitle="Phase Documents"
                items={projectThemes}
                dataKey={"_id"}
                columns={columns}
                loading={loading}
                error={error}
                canCreate={canCreate}

                canDelete={canDelete}
                onCreate={handleCreate}
                //onEdit={handleEdit}
                onDelete={(row) =>
                    confirm.ask({
                        item: row.type,
                        onConfirmAsync: () => deletePhaseDoc(row)
                    })
                }
            />
        </>
    );
}
