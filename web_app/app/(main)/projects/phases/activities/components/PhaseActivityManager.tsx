'use client';

import { useMemo } from 'react';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Phase } from '../../models/phase.model';
import { PhaseActivityApi } from "../api/phase-activity.api";
import { FilterPhaseActivityOptions, PhaseActivity, PhaseActivityStatus } from "../models/phase-activity.model";
import SavePhaseActivity from './SavePhaseActivity';
import { etbCurrencyFormatter } from '@/utils/utils';
import { PHASE_ACTIVITY_TRANSITIONS } from '../models/phase-activity.state-machine';

interface PhaseActivityManagerProps {
    phase: Phase;
}

const PhaseActivityManager = ({ phase }: PhaseActivityManagerProps) => {

    // Helper to calculate days between start and end date (inclusive)
    const calculateDurationDays = (startDate?: Date | string, endDate?: Date | string) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        if (diffTime < 0) return 0;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    // useMemo ensures that createEntityManager is only instantiated once 
    // per phase reference, keeping the hook counts stable across re-renders.
    const Manager = useMemo(() => {
        return createEntityManager<
            PhaseActivity,
            FilterPhaseActivityOptions
        >({
            title: `Activities for ${phase.title}`,
            itemName: "Activity",

            api: PhaseActivityApi,

            columns: [
                {
                    header: "Title",
                    field: "title",
                    sortable: true
                },
                {
                    header: "Duration",
                    field: "startDate",
                    sortable: true,
                    body: (row: PhaseActivity) => {
                        const days = calculateDurationDays(row.startDate, row.endDate);
                        return days > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium">
                                <i className="pi pi-clock text-xs text-gray-400" />
                                {days} {days === 1 ? 'day' : 'days'}
                            </span>
                        ) : (
                            <span className="text-gray-400">-</span>
                        );
                    }
                },
                {
                    header: "Cost",
                    field: "cost",
                    sortable: true,
                    body: (row: PhaseActivity) => (
                        <span className="font-mono text-green-700 font-medium">
                            {etbCurrencyFormatter.format(row.cost)}
                        </span>
                    )
                },
                {
                    header: "Participants",
                    field: "participants",
                    sortable: true
                },
                {
                    header: "Status",
                    field: "status",
                    body: (row: PhaseActivity) => (
                        <MyBadge
                            type="status"
                            value={row.status ?? "Proposed"}
                        />
                    )
                }
            ],

            workflow: {
                statusField: "status",
                transitions: PHASE_ACTIVITY_TRANSITIONS
            },

            createNew: () => ({
                phase,
                title: "",
                cost: 0,
                startDate: new Date(),
                endDate: new Date(),
                status: PhaseActivityStatus.planned
            }),

            SaveDialog: SavePhaseActivity,

            permissionPrefix: "phaseActivity",

            query: () => ({
                phase: phase._id
            }),
        });
    }, [phase]);

    return (
        <div className="space-y-4">
            <Manager key={phase._id} />
        </div>
    );
};

export default PhaseActivityManager;