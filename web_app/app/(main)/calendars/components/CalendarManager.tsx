import { createEntityManager } from "@/components/createEntityManager";
import { CalendarApi } from "../api/calendar.api";
import { Calendar, createEmptyCalendar } from "../models/calendar.model";
import { CALENDAR_STATUS_ORDER, CALENDAR_TRANSITIONS } from "../models/calendar.state-machine";
import SaveCalendar from "./SaveCalendar";
import MyBadge from "@/templates/MyBadge";

export default createEntityManager<Calendar, undefined>({
    title: "Manage Calendars",
    itemName: "Calendar",
    api: CalendarApi,
    columns: [
        { header: "Year", field: "year", sortable: true },

        {
            header: "Start Date",
            field: "startDate",
            body: (c: Calendar) =>
                c.startDate ? new Date(c.startDate).toLocaleDateString() : "-"
        },

        {
            header: "End Date",
            field: "endDate",
            body: (c: Calendar) =>
                c.endDate ? new Date(c.endDate).toLocaleDateString() : "-"
        },

        {
            field: "status",
            header: "Status",
            sortable: true,
            body: (c: Calendar) =>
                <MyBadge type="status" value={c.status ?? "Unknown"} />
        }
    ],
    createNew: createEmptyCalendar,
    SaveDialog: SaveCalendar,
    permissionPrefix: "calendar",
    workflow: {
        statusField: "status",
        transitions: CALENDAR_TRANSITIONS,
        statusOrder: CALENDAR_STATUS_ORDER
    }
});