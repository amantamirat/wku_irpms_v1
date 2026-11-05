'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import {
    ItemManager
} from '@/components/ItemManager';

import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import { Phase, FilterPhasesOptions } from '../models/phase.model';
import { PhaseApi } from '../api/phase.api';
import PhaseForm from './PhaseForm';

import { Project } from '@/app/(main)/projects/models/project.model';
import { etbCurrencyFormatter } from '@/utils/utils';
import { PHASE_TRANSITIONS } from '../models/phase.state-machine';
import MyBadge from '@/templates/MyBadge';
import PhaseDetail from './PhaseDetail';

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Name',
        field: 'order',
        sortable: true,
        body: (phase: Phase) => (
            <span className="font-medium">
                Phase {phase.order}
            </span>
        )
    },
    {
        header: 'Start Date',
        field: 'startDate',
        sortable: true,
        body: (phase: Phase) =>
            phase.startDate
                ? new Date(phase.startDate).toLocaleDateString()
                : '—'
    },
    {
        header: 'End Date',
        field: 'endDate',
        sortable: true,
        body: (phase: Phase) =>
            phase.endDate
                ? new Date(phase.endDate).toLocaleDateString()
                : '—'
    },
    {
        header: 'Duration',
        field: 'duration',
        sortable: true,
        style: { width: '150px' },
        body: (phase: Phase) => (
            <span>
                {phase.duration} {phase.duration === 1 ? 'day' : 'days'}
            </span>
        )
    },
    {
        header: 'Budget',
        field: 'budget',
        sortable: true,
        body: (phase: Phase) =>
            <span className="font-mono text-green-700">
                {etbCurrencyFormatter.format(phase.budget)}
            </span>
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        body: (row: Phase) => (
            <MyBadge
                type="status"
                value={row.status ?? 'Unknown'}
            />
        )
    }
];

const defaultHiddenFields = [
    'startDate',
    'endDate',
];

interface PhaseManagerProps {
    project: Project;
    useLookup?: boolean;
    disableCrud?: boolean;
}

const PhaseManager = ({
    project,
    useLookup = false,
    disableCrud = false
}: PhaseManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterPhasesOptions>(
        () => ({
            project
        }),
        [project]
    );

    /*
    const tableProps = useMemo(
        () => ({
            expandable: {
                template: (phase: Phase) => (
                    <PhaseDetail
                        project={project}
                        phase={phase}
                    />
                )
            }
        }),
        [project]
    );
    */
    return (
        <ItemManager<Phase, FilterPhasesOptions>
            api={PhaseApi}
            useLookup={useLookup}
            resource="phase"
            itemName="Phase"
            itemIcon={MENU_ICONS.phases}
            headerTitle="Manage Phases"
            columns={columns}
            filter={filter}
            dialogWidth="620px"
            enableColumnToggle
            defaultHiddenFields={defaultHiddenFields}
            statusField="status"
            hideCreateAction={disableCrud}
            hideEditAction={disableCrud}
            hideDeleteAction={disableCrud}
            transitions={
                PHASE_TRANSITIONS
            }
            renderForm={
                disableCrud
                    ? undefined
                    : (props) => (
                        <PhaseForm
                            {...props}
                            project={project}
                        />
                    )
            }
            //tableProps={tableProps}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Phase created successfully'
                        : 'Phase updated successfully'
                )
            }
        />
    );
};

export default PhaseManager;