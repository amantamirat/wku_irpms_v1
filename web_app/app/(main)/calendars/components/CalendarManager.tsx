'use client';

import { CrudManager } from "@/components/CrudManager";
import { useAuth } from "@/contexts/auth-context";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import MyBadge from "@/templates/MyBadge";
import { PERMISSIONS } from "@/types/permissions";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { CalendarApi } from "../api/calendar.api";
import { Calendar, CalendarStatus } from "../models/calendar.model";
import SaveCalendarDialog from "./SaveCalendarDialog";

const CalendarManager = () => {

    const emptyCalendar: Calendar = {
        year: new Date().getFullYear(),
        status: CalendarStatus.active,
        startDate: new Date(),
        endDate: new Date(),
    };

    const { hasPermission } = useAuth();
    const confirm = useConfirmDialog();

    const canCreate = hasPermission([PERMISSIONS.CALENDAR.CREATE]);
    const canEdit = hasPermission([PERMISSIONS.CALENDAR.UPDATE]);
    const canDelete = hasPermission([PERMISSIONS.CALENDAR.DELETE]);

    const canPlan = hasPermission([PERMISSIONS.CALENDAR.STATUS.PLANNED]);
    const canActivate = hasPermission([PERMISSIONS.CALENDAR.STATUS.ACTIVATE]);
    const canClose = hasPermission([PERMISSIONS.CALENDAR.STATUS.CLOSE]);

    const router = useRouter();


    // CRUD hook
    const {
        items: calendars,
        setAll,
        updateItem,
        removeItem,
        loading,
        setLoading,
        error,
        setError
    } = useCrudList<Calendar>();

    const [calendar, setCalendar] = useState<Calendar>(emptyCalendar);
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    /** Fetch calendars */
    useEffect(() => {
        const fetchCalendars = async () => {
            try {
                setLoading(true);
                const data = await CalendarApi.getCalendars({});
                setAll(data);
            } catch (err: any) {
                setError("Failed to fetch calendars. " + (err?.message ?? ""));
            } finally {
                setLoading(false);
            }
        };
        fetchCalendars();
    }, []);

    /** Save callback */
    const onSaveComplete = (saved: Calendar) => {
        updateItem(saved);
        hideDialogs();
    };

    const updateStatus = async (row: Calendar, next: CalendarStatus) => {
        if (!row._id) {
            return;
        }
        const updated = await CalendarApi.updateStatus(row._id, next);
        onSaveComplete({
            ...updated,
        });
    };

    const stateTransitionTemplate = (row: Calendar) => {
        const current = row.status;
        let prev = undefined;
        let next = undefined;
        if (current === CalendarStatus.planned) {
            if (canActivate) {
                next = CalendarStatus.active;
            }
        }
        else if (current === CalendarStatus.active) {
            if (canClose) {
                next = CalendarStatus.closed;
            }
            if (canPlan) {
                prev = CalendarStatus.planned;
            }
        }
        else if (current === CalendarStatus.closed) {
            if (canActivate) {
                prev = CalendarStatus.active;
            }
        }

        return (<div className="flex gap-2">
            {(next)
                &&
                <Button
                    tooltip={`Make ${next}`}
                    icon={next === CalendarStatus.closed ? "pi pi-lock" : "pi pi-check"}
                    severity={next === CalendarStatus.closed ? "danger" : "success"}
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
    const deleteCalendar = async (row: Calendar) => {
        const ok = await CalendarApi.delete(row);
        if (ok) removeItem(row);
    };

    /** Hide dialogs */
    const hideDialogs = () => {
        setShowSaveDialog(false);
    };

    /** Columns shown in CRUD table */
    const columns = [
        { header: "Year", field: "year" },
        { header: "Start Date", body: (r: Calendar) => new Date(r.startDate!).toLocaleDateString("en-CA") },
        { header: "End Date", body: (r: Calendar) => new Date(r.endDate!).toLocaleDateString("en-CA") },
        {
            header: "Status",
            field: "status",
            body: (u: Calendar) => <MyBadge type="status" value={u.status ?? "Unknown"} />
        },
        { body: stateTransitionTemplate },
        {
            body: (row: Calendar) => (
                <Button
                    icon="pi pi-arrow-right"
                    size="small"
                    onClick={() => router.push(`/calendars/${row._id}`)}
                />
            )
        },
    ];

    return (
        <>
            <CrudManager
                headerTitle="Manage Calendars"
                itemName="Calendar"
                items={calendars}
                dataKey="_id"
                columns={columns}
                loading={loading}
                error={error}

                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}

                onCreate={() => {
                    setCalendar({ ...emptyCalendar });
                    setShowSaveDialog(true);
                }}

                onEdit={(row) => {
                    setCalendar({ ...row });
                    setShowSaveDialog(true);
                }}

                onDelete={(row) =>
                    confirm.ask({
                        item: String(row.year),
                        onConfirmAsync: () => deleteCalendar(row)
                    })
                }
                enableSearch
            //rowExpansionTemplate={(row) => <CallManager calendar={row} next="project" />}
            />

            {/* Save Dialog */}
            {(calendar && showSaveDialog) && (
                <SaveCalendarDialog
                    visible={showSaveDialog}
                    calendar={calendar}
                    onComplete={onSaveComplete}
                    onHide={hideDialogs}
                />
            )}
        </>
    );
};

export default CalendarManager;
