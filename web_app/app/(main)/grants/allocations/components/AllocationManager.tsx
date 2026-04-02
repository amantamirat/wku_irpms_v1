'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Grant } from "../../models/grant.model";
import { Calendar } from "@/app/(main)/calendars/models/calendar.model";
import {
    GrantAllocation,
    GetGrantAllocationsDTO,
    createEmptyGrantAllocation
} from "../models/grant.allocation.model";
import { GrantAllocationApi } from "../api/grant.allocation.api";
import SaveAllocation from "./SaveAllocation";
import { ALLOCATION_STATUS_ORDER, ALLOCATION_TRANSITIONS, AllocationStatus } from "../models/grant.allocation.state-machine";
import MyBadge from "@/templates/MyBadge";

interface AllocationManagerProps {
    grant?: Grant;
    calendar?: Calendar;
}

const AllocationManager = ({ grant, calendar }: AllocationManagerProps) => {
    const Manager = createEntityManager<GrantAllocation, GetGrantAllocationsDTO | undefined>({
        title: "Grant Allocations",
        itemName: "Allocation",
        api: GrantAllocationApi,
        columns: [
            {
                header: "Grant",
                field: "grant",
                body: (a: GrantAllocation) =>
                    typeof a.grant === "object" ? a.grant?.title : "Loading..."
            },
            {
                header: "Calendar Year",
                field: "calendar",
                body: (a: GrantAllocation) =>
                    typeof a.calendar === "object" ? a.calendar?.year : "Loading..."
            },
            {
                header: "Total Budget",
                field: "totalBudget",
                body: (a: GrantAllocation) =>
                    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(a.totalBudget)
            },
            {
                header: "Used",
                field: "usedBudget",
                body: (a: GrantAllocation) => (
                    <span className={((a.usedBudget || 0) > a.totalBudget) ? "text-red-500 font-bold" : ""}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(a.usedBudget || 0)}
                    </span>
                )
            },
            {
                header: "Remaining",
                body: (a: GrantAllocation) => {
                    const remaining = a.totalBudget - (a.usedBudget || 0);
                    return (
                        <span style={{ color: remaining < 0 ? 'var(--red-500)' : 'var(--green-500)' }}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(remaining)}
                        </span>
                    );
                }
            },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (g: GrantAllocation) =>
                    <MyBadge type="status" value={g.status ?? 'Unknown'} />
            },
        ],
        createNew: () =>
            createEmptyGrantAllocation({ grant, calendar }),
        SaveDialog: SaveAllocation,
        permissionPrefix: "grant.allocation",
        query: () => ({
            grant: grant ? (typeof grant === 'string' ? grant : grant._id) : undefined,
            calendar: calendar ? (typeof calendar === 'string' ? calendar : calendar._id) : undefined,
            populate: true
        }),
        workflow: {
            statusField: "status",
            transitions: ALLOCATION_TRANSITIONS,
            statusOrder: ALLOCATION_STATUS_ORDER
        },
        disableDeleteRow: (row: GrantAllocation) => row.status !== AllocationStatus.planned,
    });

    return <Manager />;
};

export default AllocationManager;