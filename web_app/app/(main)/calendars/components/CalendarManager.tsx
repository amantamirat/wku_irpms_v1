'use client';

import { CrudManager } from "@/components/CrudManager";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { useCrudList } from "@/hooks/useCrudList";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import { Calendar, CalendarStatus } from "../models/calendar.model";
import { CalendarApi } from "../api/calendar.api";
import SaveCalendarDialog from "../dialogs/SaveCalendarDialog";
import MyBadge from "@/templates/MyBadge";

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

    /** Delete */
    const deleteCalendar = async (row: Calendar) => {
        const ok = await CalendarApi.deleteCalendar(row);
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
            />

            {/* Save Dialog */}
            {calendar && (
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
