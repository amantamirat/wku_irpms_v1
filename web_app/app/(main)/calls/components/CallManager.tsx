'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { CallApi } from "../api/call.api";
import { Call, createEmptyCall, GetCallsOptions } from "../models/call.model";
import SaveCall from "./SaveCall";
import MyBadge from "@/templates/MyBadge";
import { CALL_STATUS_ORDER, CALL_TRANSITIONS } from "../models/call.state-machine";
import CallDetail from "./CallDetail";
import { GrantAllocation } from "../../grants/allocations/models/grant.allocation.model";
import { Calendar } from "../../calendars/models/calendar.model";
import { etbCurrencyFormatter, Grant } from "../../grants/models/grant.model";

interface CallManagerProps {
    calendar?: string | Calendar;
    grant?: string | Grant;
}



const CallManager = ({ calendar, grant }: CallManagerProps) => {

    const Manager = createEntityManager<Call, GetCallsOptions | undefined>({
        title: "Strategic Calls Management",
        itemName: "Call",
        api: CallApi,

        columns: [
            { header: "Title", field: "title", sortable: true },

            {
                header: "Calendar",
                body: (c: Call) => {
                    const calendar = c.calendar as Calendar;
                    if (typeof calendar === "object") {
                        return calendar.year;
                    }
                    return "-";
                }
            },

            {
                header: "Grant Source",
                body: (c: Call) => {
                    const grant = c.grant as Grant;
                    if (typeof grant === "object") {
                        return grant.title;
                    }
                    return "-";
                }
            },

            {
                header: "Deadline",
                body: (c: Call) => {
                    const firstDeadline = c.deadlines?.[0]?.submission;
                    if (!firstDeadline) return "-";

                    // Format to a readable style: e.g., MM/DD/YYYY, HH:MM
                    return new Date(firstDeadline).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                }
            },

            /* --- Added Budget Column --- */
            {
                header: "Budget",
                field: "budget",
                sortable: true,
                //style: { width: '150px', textAlign: 'right' },
                body: (c: Call) => etbCurrencyFormatter.format(c.budget ?? 0)
            },

            {
                header: "Used",
                field: "usedBudget",
                body: (c: Call) => {
                    const used = c.usedBudget || 0;
                    return (
                        <span>
                            {etbCurrencyFormatter.format(used)}
                        </span>
                    );
                }
            },

            {
                field: "status",
                header: "Status",
                sortable: true,
                style: { width: '150px' },
                body: (c: Call) =>
                    <MyBadge type="status" value={c.status ?? "Unknown"} />
            }
        ],

        createNew: () => ({
            ...createEmptyCall(),
            budget: 0, // Fallback initialization value for the form structure
            grant: grant,
            calendar: calendar
        } as any),

        SaveDialog: SaveCall,
        permissionPrefix: "call",

        query: () => ({
            calendar: typeof calendar === 'object'
                ? (calendar as any)?._id
                : calendar,
            grant: typeof grant === 'object'
                ? (grant as any)?._id
                : grant,
            populate: true
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