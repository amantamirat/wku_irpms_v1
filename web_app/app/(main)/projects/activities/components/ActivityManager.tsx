'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import { Activity, FilterActivitiesOptions } from '../models/phase-activity.model';
import { ActivityApi } from '../api/phase-activity.api';
import ActivityForm from './ActivityForm';

import { Project } from '@/app/(main)/projects/models/project.model';
import { etbCurrencyFormatter } from '@/utils/utils';
import MyBadge from '@/templates/MyBadge';
import { Phase } from '../../phases/models/phase.model';
import { PHASE_ACTIVITY_TRANSITIONS } from '../models/phase-activity.state-machine';

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Title',
        field: 'title',
        sortable: true,
        body: (activity: Activity) => (
            <span className="font-medium">
                {activity.title}
            </span>
        )
    },
    {
        header: 'Phase',
        field: 'phase',
        sortable: true,
        body: (activity: Activity) => {
            const phase = activity.phase;

            if (!phase) {
                return <span className="text-400">—</span>;
            }

            // Handle either a populated Phase object or an ID.
            if (typeof phase === 'object') {
                return (
                    <span className="font-medium">
                        Phase {phase.order}
                    </span>
                );
            }

            return <span className="text-400">—</span>;
        }
    },
    {
        header: 'Description',
        field: 'description',
        sortable: true,
        body: (activity: Activity) => (
            <span className="text-600 text-sm">
                {activity.description ? (
                    activity.description.length > 50
                        ? `${activity.description.substring(0, 50)}...`
                        : activity.description
                ) : (
                    '—'
                )}
            </span>
        )
    },
    {
        header: 'Cost',
        field: 'cost',
        sortable: true,
        body: (activity: Activity) => (
            <span className="font-mono text-green-700">
                {etbCurrencyFormatter.format(activity.cost)}
            </span>
        )
    },
    {
        header: 'Breakdown',
        field: 'detailCost',
        sortable: false,
        body: (activity: Activity) => (
            activity.detailCost ? (
                <span className="text-xs text-600">
                    {activity.detailCost.duration}d &times; {activity.detailCost.participants}p &times; {etbCurrencyFormatter.format(activity.detailCost.unitPrice)}
                </span>
            ) : (
                <span className="text-400">—</span>
            )
        )
    },
    {
        header: 'Start Date',
        field: 'startDate',
        sortable: true,
        body: (activity: Activity) =>
            activity.startDate
                ? new Date(activity.startDate).toLocaleDateString()
                : '—'
    },
    {
        header: 'End Date',
        field: 'endDate',
        sortable: true,
        body: (activity: Activity) =>
            activity.endDate
                ? new Date(activity.endDate).toLocaleDateString()
                : '—'
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        body: (row: Activity) => (
            <MyBadge
                type="status"
                value={row.status ?? 'Unknown'}
            />
        )
    }
];

const defaultHiddenFields = [
    'phase',
    'description',
    'detailCost',
    'startDate',
    'endDate'
];

interface ActivityManagerProps {
    project?: Project;
    phase?: Phase;
    useLookup?: boolean;
    disableCrud?: boolean;
}

const ActivityManager = ({
    project,
    phase,
    useLookup = false,
    disableCrud = false
}: ActivityManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterActivitiesOptions>(
        () => ({
            project: project?._id ?? project,
            phase: phase?._id ?? phase
        }),
        [project, phase]
    );

    return (
        <ItemManager<Activity, FilterActivitiesOptions>
            api={ActivityApi}
            useLookup={useLookup}
            resource="phaseActivity"
            itemName="Activity"
            itemIcon={MENU_ICONS.activities ?? 'pi pi-check-square'}
            headerTitle="Manage Activities"
            columns={columns}
            filter={filter}
            dialogWidth="720px"
            enableColumnToggle
            defaultHiddenFields={defaultHiddenFields}
            statusField="status"
            hideCreateAction={disableCrud}
            hideEditAction={disableCrud}
            hideDeleteAction={disableCrud}
            transitions={
                PHASE_ACTIVITY_TRANSITIONS
            }
            renderForm={
                disableCrud
                    ? undefined
                    : (props) => (
                        <ActivityForm
                            {...props}
                            project={project}
                            phase={phase}
                        />
                    )
            }
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Activity created successfully'
                        : 'Activity updated successfully'
                )
            }
        />
    );
};

export default ActivityManager;