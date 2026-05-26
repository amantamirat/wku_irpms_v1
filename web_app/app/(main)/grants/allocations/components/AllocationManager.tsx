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

import {
    ALLOCATION_STATUS_ORDER,
    ALLOCATION_TRANSITIONS,
    AllocationStatus
} from "../models/grant.allocation.state-machine";

import MyBadge from "@/templates/MyBadge";

interface AllocationManagerProps {
    grant?: Grant;
    calendar?: Calendar;
}

const currencyFormatter = new Intl.NumberFormat(
    'en-US',
    {
        style: 'currency',
        currency: 'ETB'
    }
);

const AllocationManager = ({
    grant,
    calendar
}: AllocationManagerProps) => {

    const Manager = createEntityManager<
        GrantAllocation,
        GetGrantAllocationsDTO | undefined
    >({

        title: "Grant Allocations",

        itemName: "Allocation",

        api: GrantAllocationApi,

        columns: [

            {
                header: "Grant",
                field: "grant",

                body: (a: GrantAllocation) =>
                    typeof a.grant === "object"
                        ? a.grant?.title
                        : "Loading..."
            },

            {
                header: "Fiscal",
                field: "calendar",

                body: (a: GrantAllocation) =>
                    typeof a.calendar === "object"
                        ? a.calendar?.year
                        : "Loading..."
            },

            {
                header: "Allocated Amount",
                field: "allocatedAmount",
                body: (a: GrantAllocation) =>
                    currencyFormatter.format(a.allocatedAmount || 0)
            },
            /**
            * USED
            */
            {
                header: "Used Budget",
                field: "usedBudget",

                body: (a: GrantAllocation) => {

                    const used = a.usedBudget || 0;

                    return (
                        <span>
                            {currencyFormatter.format(used)}
                        </span>
                    );
                }
            },
            /**
             * STATUS
             */
            {
                field: "status",

                header: "Status",

                sortable: true,

                body: (g: GrantAllocation) =>
                    <MyBadge
                        type="status"
                        value={g.status ?? 'Unknown'}
                    />
            },
        ],

        createNew: () =>
            createEmptyGrantAllocation({
                grant,
                calendar
            }),

        SaveDialog: SaveAllocation,

        permissionPrefix: "grant.allocation",

        query: () => ({
            grant: grant
                ? (
                    typeof grant === 'string'
                        ? grant
                        : grant._id
                )
                : undefined,

            calendar: calendar
                ? (
                    typeof calendar === 'string'
                        ? calendar
                        : calendar._id
                )
                : undefined,

            populate: true
        }),

        workflow: {
            statusField: "status",
            transitions: ALLOCATION_TRANSITIONS,
            statusOrder: ALLOCATION_STATUS_ORDER
        },

        /**
         * Only deletable while planned
         */
        disableDeleteRow: (
            row: GrantAllocation
        ) =>
            row.status !== AllocationStatus.planned,
    });

    return <Manager />;
};

export default AllocationManager;