'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { Call, CycleStatus } from "../models/call.model";
import { CallApi } from "../api/call.api";
import SaveCall from "./SaveCall";
import StageManager from "../stages/components/StageManager";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";



const CallManager = () => {

    const emptyCycle: Call = {
        calendar: "",
        directorate: "",
        title: "",
        grant: "",
        thematic: "",
        status: CycleStatus.planned
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.CALL.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CALL.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CALL.DELETE]);

    /** CRUD Hook */
    const {
        items: cycles,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Call>();

    const [cycle, setCycle] = useState<Call>(emptyCycle);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch cycles */
    useEffect(() => {
        const loadCycles = async () => {
            try {
                setLoading(true);
                const data = await CallApi.getCalls({});
                setAll(data);
            } catch (err: any) {
                setError("Failed to load cycles. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        loadCycles();
    }, []);

    /** Save cycle */
    const onSaveComplete = (saved: Call) => {
        updateItem(saved);
        hideDialogs();
    };

    /** Delete */
    const deleteCall = async (row: Call) => {
        const ok = await CallApi.delete(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns for CrudManager */
    const columns = [
        { header: "Calendar", field: "calendar.year" },
        { header: "Directorate", field: "directorate.name" },
        { header: "Title", field: "title" },
        { header: "Grant", field: "grant.title" },
        { header: "Theme", field: "thematic.title" }
    ];

    return (
        <>
            <CrudManager
                headerTitle={`Manage Calls`}
                itemName="Call"
                items={cycles}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}
                

                /** Permissions */
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                /** Create */
                onCreate={() => {
                    setCycle({ ...emptyCycle });
                    setShowSaveDialog(true);
                }}

                /** Edit */
                onEdit={(row) => {
                    setCycle({ ...row });
                    setShowSaveDialog(true);
                }}

                /** Delete */
                onDelete={(row) =>
                    confirm.ask({
                        item: row.title,
                        onConfirmAsync: () => deleteCall(row)
                    })
                }
                //enableSearch

                /** Expand: Stage Manager */
                rowExpansionTemplate={(row) => <StageManager call={row} />}
            />

            {/* Save Dialog */}
            {cycle && (
                <SaveCall
                    visible={showSaveDialog}
                    call={cycle}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default CallManager;
