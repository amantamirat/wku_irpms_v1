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
import { Grant } from "../../grants/models/grant.model";

interface CallManagerProps {
    grantAllocation?: string | GrantAllocation;
    calendar?: string | Calendar;
    grant?: string | Grant;
}

// Simple currency formatter utility
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB', // Adjust currency code as necessary
        maximumFractionDigits: 0
    }).format(amount);
};

const CallManager = ({ grantAllocation, calendar, grant }: CallManagerProps) => {

    const Manager = createEntityManager<Call, GetCallsOptions | undefined>({
        title: "Strategic Calls Management",
        itemName: "Call",
        api: CallApi,

        columns: [
            { header: "Title", field: "title", sortable: true },

            {
                header: "Calendar",
                body: (c: Call) => {
                    const alloc = c.grantAllocation as GrantAllocation;
                    if (typeof alloc === "object" && alloc?.calendar) {
                        return typeof alloc.calendar === "object" ? alloc.calendar.year : alloc.calendar;
                    }
                    return "-";
                }
            },

            {
                header: "Grant Source",
                body: (c: Call) => {
                    const alloc = c.grantAllocation as GrantAllocation;
                    if (typeof alloc === "object" && alloc?.grant) {
                        return typeof alloc.grant === "object" ? alloc.grant.title : alloc.grant;
                    }
                    return "Unassigned";
                }
            },

            /* --- Added Budget Column --- */
            {
                header: "Budget",
                field: "budget",
                sortable: true,
                style: { width: '150px', textAlign: 'right' },
                body: (c: Call) => c.budget !== undefined ? formatCurrency(c.budget) : "-"
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
            grantAllocation: grantAllocation,
        } as any),

        SaveDialog: SaveCall,
        permissionPrefix: "call",

        query: () => ({
            grantAllocation: typeof grantAllocation === 'object' ? grantAllocation._id : grantAllocation,
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