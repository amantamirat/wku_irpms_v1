'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { CallApi } from "../api/call.api";
import { Call, createEmptyCall, GetCallsOptions } from "../models/call.model";

import SaveCall from "./SaveCall";

import { Grant } from "../../grants/models/grant.model";
import { Calendar } from "../../calendars/models/calendar.model";

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

            { header: "Status", field: "status" }
        ],

        createNew: createEmptyCall,
        SaveDialog: SaveCall,
        permissionPrefix: "call",

        query: () => ({
            grant: grant ?? undefined,
            calendar: calendar ?? undefined
        })
    });

    return <Manager />;
};

export default CallManager;