'use client';
import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { Calendar } from "../../calendars/models/calendar.model";
import { Organization } from "../../organizations/models/organization.model";
import ProjectManager from "../../projects/components/ProjectManager";
import { CallApi } from "../api/call.api";
import { Call, CallStatus } from "../models/call.model";
import StageManager from "../stages/components/StageManager";
import SaveCall from "./SaveCall";

interface CallManagerProps {
    directorate?: Organization;
    calendar?: Calendar;
    next?: "stage" | "project";
}

const CallManager = ({ calendar, directorate, next = "stage" }: CallManagerProps) => {

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.CALL.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CALL.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CALL.DELETE]);

    const canPlan = hasPermission([PERMISSIONS.CALL.STATUS.PLANNED]);
    const canActivate = hasPermission([PERMISSIONS.CALL.STATUS.ACTIVATE]);
    const canClose = hasPermission([PERMISSIONS.CALL.STATUS.CLOSE]);

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
                const data = await CallApi.getCalls({ calendar, directorate });
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
        if (!row._id) return
        const updated = await CallApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
            calendar: row.calendar,
            directorate: row.directorate,
            thematic: row.thematic,
            grant: row.grant
        });
    };

    const stateTransitionTemplate = (row: Call) => {
        const current = row.status;
        let prev = undefined;
        let next = undefined;
        if (current === CallStatus.planned) {
            if (canActivate) {
                next = CallStatus.active;
            }
        }
        else if (current === CallStatus.active) {
            if (canClose) {
                next = CallStatus.closed;
            }
            if (canPlan) {
                prev = CallStatus.planned;
            }
        }
        else if (current === CallStatus.closed) {
            if (canActivate) {
                prev = CallStatus.active;
            }
        }

        return (<div className="flex gap-2">
            {(next)
                &&
                <Button
                    tooltip={`Make ${next}`}
                    icon={next === CallStatus.closed ? "pi pi-lock" : "pi pi-check"}
                    severity={next === CallStatus.closed ? "danger" : "success"}
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: `Make to ${next}`,
                            onConfirmAsync: () => updateStatus(row, next)
                        });
                    }}
                />
            }
            {(prev)
                &&
                <Button
                    tooltip={`Back to ${prev}`}
                    icon="pi pi-undo"
                    severity="warning"
                    size="small"
                    onClick={() => {
                        confirm.ask({
                            operation: `back to ${prev}`,
                            onConfirmAsync: () => updateStatus(row, prev)
                        });
                    }}
                />
            }
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
        !directorate && { header: "Directorate", field: "directorate.name" },
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
                    calendarProvided={!!calendar}
                    directorateProvided={!!directorate}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default CallManager;
