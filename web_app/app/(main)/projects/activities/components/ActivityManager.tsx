'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import {
    Activity,
    FilterActivitiesOptions,
    PhaseActivityTypeLabels,
} from '../models/phase-activity.model';
import { ActivityApi } from '../api/phase-activity.api';
import ActivityForm from './ActivityForm';

import { Project } from '@/app/(main)/projects/models/project.model';
import { etbCurrencyFormatter } from '@/utils/utils';
import MyBadge from '@/templates/MyBadge';
import { Phase } from '../../phases/models/phase.model';
import { PHASE_ACTIVITY_TRANSITIONS } from '../models/phase-activity.state-machine';
import ActivityExpandedRow from './ActivityExpandedRow';

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Title',
        field: 'title',
        sortable: true,
        body: (activity: Activity) => (
            <span className="font-medium">{activity.title}</span>
        )
    },
    {
        header: 'Type',
        field: 'kind',
        sortable: true,
        body: (activity: Activity) => {
            const meta = PhaseActivityTypeLabels[activity.kind];

            return (
                <span
                    className="text-sm"
                    title={meta?.description}
                >
                    {meta?.label ?? activity.kind ?? '—'}
                </span>
            );
        }
    },
    {
        header: 'Phase',
        field: 'phase',
        // Phase is a populated object, so server-side sorting on it
        // would sort by id rather than by phase order.
        sortable: false,
        body: (activity: Activity) => {
            const phase = activity.phase;

            // Phase is optional, and may be an unpopulated id.
            if (!phase || typeof phase !== 'object') {
                return <span className="text-400">—</span>;
            }

            return (
                <span className="font-medium">
                    Phase {phase.order}
                </span>
            );
        }
    },
    {
        header: 'Description',
        field: 'description',
        sortable: true,
        body: (activity: Activity) => (
            <span className="text-600 text-sm">
                {activity.description
                    ? activity.description.length > 50
                        ? `${activity.description.substring(0, 50)}...`
                        : activity.description
                    : '—'}
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
        body: (activity: Activity) =>
            activity.detailCost ? (
                <span className="text-xs text-600">
                    {activity.detailCost.duration}d &times;{' '}
                    {activity.detailCost.participants}p &times;{' '}
                    {etbCurrencyFormatter.format(activity.detailCost.unitPrice)}
                </span>
            ) : (
                <span className="text-400">—</span>
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
            <MyBadge type="status" value={row.status ?? 'Unknown'} />
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

    const projectId = project?._id;
    const phaseId = phase?._id;

    // Depend on ids, not object identity, so a re-rendered parent
    // passing an equal object doesn't trigger a refetch. Only send
    // the keys that are actually set, and always send ids, never objects.
    const filter = useMemo<FilterActivitiesOptions>(
        () => ({
            ...(projectId && { project: projectId }),
            ...(phaseId && { phase: phaseId })
        }),
        [projectId, phaseId]
    );

    const tableProps = useMemo(
        () => ({
            expandable: {
                template: (row: Activity) => <ActivityExpandedRow activity={row} />
            }
        }),
        []
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
            transitions={PHASE_ACTIVITY_TRANSITIONS}
            tableProps={tableProps}
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