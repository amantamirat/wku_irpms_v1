'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { Call, CallStatus } from "../models/call.model";
import { CallApi } from "../api/call.api";
import SaveCall from "./SaveCall";
import StageManager from "../stages/components/StageManager";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import CallTabs from "./CallTabs";
import MyBadge from "@/templates/MyBadge";
import { Button } from "primereact/button";



const CallManager = () => {

    const emptyCycle: Call = {
        calendar: "",
        directorate: "",
        title: "",
        grant: "",
        thematic: "",
        status: CallStatus.planned
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.CALL.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CALL.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CALL.DELETE]);

    const canPlan = hasPermission([PERMISSIONS.CALL.STATUS.PLANNED]);
    const canActivate = hasPermission([PERMISSIONS.CALL.STATUS.ACTIVATE]);
    const canClose = hasPermission([PERMISSIONS.CALL.STATUS.CLOSE]);

    const canChangeStatus = hasPermission([PERMISSIONS.CALL.CHANGE_STATUS]);

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
        const fetchCalls = async () => {
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
        fetchCalls();
    }, []);

    /** Save cycle */
    const onSaveComplete = (saved: Call) => {
        updateItem(saved);
        hideDialogs();
    };

    const updateStatus = async (row: Call, next: CallStatus) => {
        if (!row._id) {
            return
        }
        const updated = await CallApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
            calendar: row.calendar,
            directorate: row.directorate,
            thematic: row.thematic,
            grant: row.grant
        });
    };


    const stateTransitionTemplate = (rowData: Call) => {
        const state = rowData.status;
        return (
            <div className="flex gap-2">
                {canActivate && <>
                    {(state === CallStatus.planned || state === CallStatus.closed) &&
                        <Button
                            label="Activate"
                            icon="pi pi-check"
                            severity="success"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'activate',
                                    onConfirmAsync: () => updateStatus(rowData, CallStatus.active)
                                });
                            }}
                        />
                    }
                </>}
                {canClose && <>
                    {(state === CallStatus.active) &&
                        <Button
                            label="Close"
                            icon="pi pi-lock"
                            severity="danger"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'close',
                                    onConfirmAsync: () => updateStatus(rowData, CallStatus.closed)
                                });
                            }}
                        />
                    }
                </>}

                {canPlan && <>
                    {(state === CallStatus.active) &&
                        <Button
                            tooltip="Plan"
                            icon="pi pi-arrow-left"
                            severity="warning"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: 'change to plan',
                                    onConfirmAsync: () => updateStatus(rowData, CallStatus.planned)
                                });
                            }}
                        />
                    }
                </>}
            </div>);
    }

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
        { header: "Theme", field: "thematic.title" },
        {
            header: "Status",
            body: (row: Call) => <MyBadge type="status" value={row.status ?? "Unknown"} />,
            sortable: true
        },
        canChangeStatus && { body: stateTransitionTemplate }
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
                rowExpansionTemplate={(row) => <CallTabs call={row} />}
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
