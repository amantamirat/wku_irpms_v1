'use client';

import { CrudManager } from "@/components/CrudManager";
import { DirectorateSelector } from "@/components/DirectorateSelector";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useDirectorate } from "@/contexts/DirectorateContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { Calendar } from "../../calendars/models/calendar.model";
import ProjectManager from "../../projects/components/ProjectManager";
import { CallApi } from "../api/call.api";
import { Call, CallStatus } from "../models/call.model";
import StageManager from "../stages/components/StageManager";
import SaveCall from "./SaveCall";

interface CallManagerProps {
    calendar?: Calendar;
    next?: "stage" | "project";
}

const CallManager = ({ calendar, next = "stage" }: CallManagerProps) => {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.CALL.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CALL.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CALL.DELETE]);

    const canActivate = hasPermission([PERMISSIONS.CALL.STATUS.ACTIVATE]);
    const canClose = hasPermission([PERMISSIONS.CALL.STATUS.CLOSE]);
    const canPlan = hasPermission([PERMISSIONS.CALL.STATUS.PLANNED]);

    //const canChangeStatus = hasPermission([PERMISSIONS.CALL.CHANGE_STATUS]);

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

    const { directorate, directorates } = useDirectorate();

    const emptyCycle: Call = {
        calendar: calendar ?? "",
        directorate: directorate ?? "",
        title: "",
        grant: "",
        thematic: "",
        status: CallStatus.planned
    };

    const [calls, setCalls] = useState<Call>(emptyCycle);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch calls */
    useEffect(() => {
        if (!directorate && !calendar) {
            return
        }
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const query = calendar
                    ? { calendar }
                    : { directorate };
                const data = await CallApi.getCalls(query);
                setAll(data);
            } catch (err: any) {
                setError("Failed to load calendars. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, [calendar, directorate]);

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
                            tooltip="Close"
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
        !calendar && { header: "Calendar", field: "calendar.year" },
        calendar && { header: "Directorate", field: "directorate.name" },
        { header: "Title", field: "title" },
        { header: "Grant", field: "grant.title" },
        { header: "Theme", field: "thematic.title" },
        {
            header: "Status",
            body: (row: Call) => <MyBadge type="status" value={row.status ?? "Unknown"} />,
            sortable: true
        },
        { body: stateTransitionTemplate }
    ];

    const topTemplate = () => {
        if (calendar) {
            return undefined;
        }
        return (<DirectorateSelector />)
    };

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
                    setCalls({ ...emptyCycle });
                    setShowSaveDialog(true);
                }}

                canEditRow={(row: Call) => row.status === CallStatus.planned}
                canDeleteRow={(row: Call) => row.status === CallStatus.planned}

                /** Edit */
                onEdit={(row) => {
                    setCalls({ ...row });
                    setShowSaveDialog(true);
                }}

                /** Delete */
                onDelete={(row) =>
                    confirm.ask({
                        item: row.title,
                        onConfirmAsync: () => deleteCall(row)
                    })
                }

                topTemplate={topTemplate()}
                //enableSearch
                rowExpansionTemplate={(row) => {
                    if (next === "project") {
                        return (<ProjectManager call={row} />)
                    }
                    return (<StageManager call={row} />)
                }}
            />

            {/* Save Dialog */}
            {(calls && showSaveDialog) && (
                <SaveCall
                    visible={showSaveDialog}
                    call={calls}
                    directorates={directorates}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default CallManager;
