'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { CallApi } from "../api/call.api";
import { Call, createEmptyCall, GetCallsOptions } from "../models/call.model";

import SaveCall from "./SaveCall";

import MyBadge from "@/templates/MyBadge";
import { Calendar } from "../../calendars/models/calendar.model";
import { Grant } from "../../grants/models/grant.model";
import { CALL_STATUS_ORDER, CALL_TRANSITIONS } from "../models/call.state-machine";
import CallDetail from "./CallDetail";

interface CallManagerProps {
    grant?: Grant;
    calendar?: Calendar;
}

const CallManager = ({ grant, calendar }: CallManagerProps) => {

    const Manager = createEntityManager<Call, GetCallsOptions | undefined>({
        title: "Manage Calls",
        itemName: "Call",
        api: CallApi,

        columns: [
            { header: "Title", field: "title" },

            {
                header: "Calendar",
                field: "calendar",
                body: (c: Call) =>
                    typeof c.calendar === "object"
                        ? c.calendar?.year
                        : c.calendar
            },

            {
                header: "Grant",
                field: "grant",
                body: (c: Call) =>
                    typeof c.grant === "object"
                        ? c.grant?.title
                        : c.grant
            },

            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (c: Call) =>
                    <MyBadge type="status" value={c.status ?? "Unknown"} />
            }
        ],
        createNew: () => createEmptyCall({
            calendar,
            grant
        }),
        SaveDialog: SaveCall,
        permissionPrefix: "call",

        query: () => ({
            grant: grant ?? undefined,
            calendar: calendar ?? undefined
        }),
        workflow: {
            statusField: "status",
            transitions: CALL_TRANSITIONS,
            statusOrder: CALL_STATUS_ORDER
        },
        expandable: {
            template: (call) => (
                <CallDetail call={call} />
            )
        }
    });

    return <Manager />;
};

export default CallManager;