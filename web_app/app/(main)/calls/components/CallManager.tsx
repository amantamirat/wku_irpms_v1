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
    // If passed, these will usually come as IDs or full objects depending on the parent view
    grantAllocation?: string | GrantAllocation;
    calendar?: string | Calendar;
    grant?: string | Grant;
}

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

            // 1. Set the direct allocation if available
            grantAllocation: typeof grantAllocation === 'object'
                ? grantAllocation?._id
                : grantAllocation,

            // 2. Pass filters to help SaveCall fetch the right allocations
            // We flatten these as well so SaveCall receives a clean string ID
            _filterCalendar: typeof calendar === 'object'
                ? (calendar as any)?._id
                : calendar,

            _filterGrant: typeof grant === 'object'
                ? (grant as any)?._id
                : grant
        } as any),

        SaveDialog: SaveCall,
        permissionPrefix: "call",

        query: () => ({
            // Ensure we pass the ID string if an object was provided via props
            grantAllocation: typeof grantAllocation === 'object' ? grantAllocation._id : grantAllocation,
            // Flatten Calendar (handles string | Calendar)
            calendar: typeof calendar === 'object'
                ? (calendar as any)?._id
                : calendar,

            // Flatten Grant (handles string | Grant)
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