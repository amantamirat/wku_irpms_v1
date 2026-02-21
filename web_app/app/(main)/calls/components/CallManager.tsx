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
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { CallApi } from "../api/call.api";
import { Call, CallStatus } from "../models/call.model";
import CallDetail from "./CallDetail";
import SaveCall from "./SaveCall";

interface CallManagerProps {
    directorate?: Organization;
    calendar?: Calendar;
    grant?: Grant;
    next?: "stage" | "project";
}

const CallManager = ({ calendar, directorate, grant, next = "stage" }: CallManagerProps) => {

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
        grant: grant ?? "",
        thematic: "",
        status: CallStatus.planned
    };

    const [calls, setCalls] = useState<Call>(emptyCycle);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch calls */
    useEffect(() => {
        if (!directorate && !calendar && !grant) {
            return
        }
        const fetchCalls = async () => {
            try {
                setLoading(true);
                const data = await CallApi.getCalls({ calendar, directorate, grant });
                setAll(data);
            } catch (err: any) {
                setError("Failed to load calls. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, [calendar, directorate, grant]);

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

        // ✅ Explicit types
        let prev: CallStatus | undefined = undefined;
        let next: CallStatus | undefined = undefined;

        if (current === CallStatus.planned) {
            if (canActivate) {
                next = CallStatus.active;
            }
        } else if (current === CallStatus.active) {
            if (canClose) {
                next = CallStatus.closed;
            }
            if (canPlan) {
                prev = CallStatus.planned;
            }
        } else if (current === CallStatus.closed) {
            if (canActivate) {
                prev = CallStatus.active;
            }
        }

        return (
            <div className="flex gap-2">
                {/* ✅ Next Button */}
                {next && (() => {
                    const nextStatus = next; // local constant for TS
                    return (
                        <Button
                            tooltip={`Make ${nextStatus}`}
                            icon={nextStatus === CallStatus.closed ? "pi pi-lock" : "pi pi-check"}
                            severity={nextStatus === CallStatus.closed ? "danger" : "success"}
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: `Make to ${nextStatus}`,
                                    onConfirmAsync: () => updateStatus(row, nextStatus),
                                });
                            }}
                        />
                    );
                })()}

                {/* ✅ Prev Button */}
                {prev && (() => {
                    const prevStatus = prev; // local constant for TS
                    return (
                        <Button
                            tooltip={`Back to ${prevStatus}`}
                            icon="pi pi-undo"
                            severity="warning"
                            size="small"
                            onClick={() => {
                                confirm.ask({
                                    operation: `Back to ${prevStatus}`,
                                    onConfirmAsync: () => updateStatus(row, prevStatus),
                                });
                            }}
                        />
                    );
                })()}
            </div>
        );
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
        !calendar && { header: "Calendar", field: "calendar.year" },
        !directorate && { header: "Directorate", field: "directorate.name" },
        { header: "Title", field: "title" },
        !grant && { header: "Grant", field: "grant.title" },
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
                //itemName="Call"
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
                rowExpansionTemplate={(row) => <CallDetail call={row} />}
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
