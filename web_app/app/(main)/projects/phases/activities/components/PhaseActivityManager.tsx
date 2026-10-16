'use client';

import { useEffect, useMemo, useState } from 'react';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import MyBadge from "@/templates/MyBadge";
import { Phase } from '../../models/phase.model';
import { PhaseActivityApi } from "../api/phase-activity.api";
import { FilterPhaseActivityOptions, PhaseActivity, PhaseActivityStatus } from "../models/phase-activity.model";
import SavePhaseActivity from './SavePhaseActivity';
import { etbCurrencyFormatter } from '@/utils/utils';
import { PHASE_ACTIVITY_TRANSITIONS } from '../models/phase-activity.state-machine';
import { ProjectComponentApi } from '../../api/phase-component.api';
import type { ProjectComponent } from '../../models/phase-component.model';

interface PhaseActivityManagerProps {
    phase: Phase;
}

// Helper exported for reuse in SaveDialog and Manager
export const computeDurationFromDates = (startDate?: Date | string, endDate?: Date | string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const PhaseActivityManager = ({ phase }: PhaseActivityManagerProps) => {
    const [components, setComponents] = useState<ProjectComponent[]>([]);

    useEffect(() => {
        if (!phase._id) return;
        ProjectComponentApi.getByPhase(phase._id)
            .then(setComponents)
            .catch((error) => console.error('Failed to load project components:', error));
    }, [phase._id]);

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
                    ...(components.length ? [{
                    header: "Component",
                    field: "component",
                    body: (row: PhaseActivity) => (
                        <span>{typeof row.component === 'object' ? row.component?.title : '-'}</span>
                    )
                }] : []),
                {
                    header: "Timeline",
                    field: "startDate",
                    sortable: true,
                    body: (row: PhaseActivity) => {
                        if (!row.startDate || !row.endDate) return <span className="text-gray-400">-</span>;
                        const startStr = new Date(row.startDate).toLocaleDateString();
                        const endStr = new Date(row.endDate).toLocaleDateString();
                        return (
                            <span className="text-gray-700 font-medium">
                                {startStr} &rarr; {endStr}
                            </span>
                        );
                    }
                },
                {
                    header: "Span",
                    field: "endDate",
                    sortable: true,
                    body: (row: PhaseActivity) => {
                        const days = computeDurationFromDates(row.startDate, row.endDate);
                        return days > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-gray-700 font-medium">
                                <i className="pi pi-clock text-xs text-gray-400" />
                                {days} {days === 1 ? 'day' : 'days'}
                            </span>
                        ) : (
                            <span className="text-blue-400">-</span>
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
                /*
                {
                    header: "Participants",
                    field: "detailCost.participants",
                    sortable: true,
                    body: (row: PhaseActivity) => (
                        <span>{row.detailCost?.participants ?? '-'}</span>
                    )
                },
                */
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

            useLookup: true,

            createNew: () => ({
                phase,
                title: "",
                cost: 0,
                detailCost: {
                    duration: 1,
                    participants: 1,
                    unitPrice: 0
                },
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
    }, [phase, components]);

    return (
        <div className="space-y-4">
            {components.some(component => component.activities?.length) && (
                <div className="grid mb-3">
                    {components.filter(component => component.activities?.length).map(component => (
                        <div key={component._id} className="col-12 md:col-6">
                            <div className="surface-card border-1 border-200 border-round p-3 h-full">
                                <div className="flex align-items-start justify-content-between gap-2">
                                    <div>
                                        <h5 className="m-0 text-900">{component.title}</h5>
                                        {component.description && <p className="text-600 text-sm mb-2">{component.description}</p>}
                                    </div>
                                    <MyBadge type="status" value={component.status || 'planned'} />
                                </div>
                                <small className="text-600">
                                    Contributors: {(component.contributors || []).map(member =>
                                        typeof member === 'object' ? member.name : member
                                    ).join(', ')}
                                    {component.activities?.length ? ` · ${component.activities.length} activities` : ' · No activities yet'}
                                </small>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Manager key={phase._id} />
        </div>
    );
};

export default PhaseActivityManager;