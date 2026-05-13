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
                header: "Total Budget",
                field: "totalBudget",

                body: (a: GrantAllocation) =>
                    currencyFormatter.format(a.totalBudget || 0)
            },

            /**
             * RESERVED
             */
            {
                header: "Reserved",
                field: "reservedBudget",

                body: (a: GrantAllocation) => {

                    const reserved = a.reservedBudget || 0;

                    const exceeded =
                        reserved > a.totalBudget;

                    return (
                        <span
                            className={
                                exceeded
                                    ? "text-red-500 font-bold"
                                    : ""
                            }
                        >
                            {currencyFormatter.format(reserved)}
                        </span>
                    );
                }
            },

            /**
             * USED
             */
            {
                header: "Used",
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
             * AVAILABLE
             */
            {
                header: "Available",

                body: (a: GrantAllocation) => {

                    const total = a.totalBudget || 0;

                    const reserved =
                        a.reservedBudget || 0;

                    const available =
                        total - reserved;

                    return (
                        <span
                            className={
                                available <= 0
                                    ? "text-red-500 font-bold"
                                    : available < (total * 0.1)
                                        ? "text-orange-500 font-semibold"
                                        : "text-green-600"
                            }
                        >
                            {currencyFormatter.format(available)}
                        </span>
                    );
                }
            },

            /**
             * UTILIZATION %
             */
            {
                header: "Utilization",

                body: (a: GrantAllocation) => {

                    const total = a.totalBudget || 0;

                    const used = a.usedBudget || 0;

                    const percent =
                        total > 0
                            ? ((used / total) * 100)
                            : 0;

                    return (
                        <span
                            className={
                                percent >= 100
                                    ? "text-red-500 font-bold"
                                    : percent >= 80
                                        ? "text-orange-500 font-semibold"
                                        : ""
                            }
                        >
                            {percent.toFixed(1)}%
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