'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';
import MyBadge from '@/templates/MyBadge';

import { Call } from '../../models/call.model';
import { StageApi } from '../api/stage.api';
import { FilterStagesDTO, Stage } from '../models/stage.model';
import { STAGE_TRANSITIONS } from '../models/stage.state-machine';
import StageForm from './StageForm';

interface StageManagerProps {
    call: Call;
}

const DEFAULT_HIDDEN = [
    'order',
    'evaluation',
    'template',
    'constraint',
];

const getStageColumns = (): ColumnProps[] => [
    {
        header: 'Name',
        field: 'name',
        sortable: true,
    },
    {
        header: 'Order',
        field: 'order',
        sortable: true,
        style: { width: '6rem' },
    },
    {
        header: 'Evaluation',
        field: 'evaluation',
        body: (stage: Stage) =>
            typeof stage.evaluation === 'object' && stage.evaluation !== null
                ? stage.evaluation.title
                : stage.evaluation ?? '-',
    },
    {
        header: 'Reviewer Limits',
        field: 'minReviewers',
        sortable: true,
        style: { width: '12rem' },
        body: (stage: Stage) => {
            const min = stage.minReviewers ?? '-';
            const max = stage.maxReviewers ?? '-';
            return `${min} - ${max}`;
        },
    },
    {
        header: 'Min Score',
        field: 'minAcceptanceScore',
        sortable: true,
        style: { width: '8rem' },
        body: (stage: Stage) =>
            stage.minAcceptanceScore !== undefined
                ? stage.minAcceptanceScore
                : '-',
    },
    {
        header: 'Template',
        field: 'template',
        body: (stage: Stage) =>
            typeof stage.template === 'object' && stage.template !== null
                ? stage.template.name
                : stage.template ?? '-',
    },
    {
        header: 'Constraint',
        field: 'constraint',
        body: (stage: Stage) =>
            typeof stage.constraint === 'object' && stage.constraint !== null
                ? stage.constraint.name
                : stage.constraint ?? '-',
    },
    {
        header: 'Deadline',
        field: 'deadline',
        sortable: true,
        style: { width: '12rem' },
        body: (stage: Stage) =>
            stage.deadline
                ? new Date(stage.deadline).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                  })
                : '-',
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        style: { width: '150px' },
        body: (stage: Stage) => (
            <MyBadge
                type="status"
                value={stage.status ?? 'Unknown'}
            />
        ),
    },
];

export default function StageManager({ call }: StageManagerProps) {
    const toast = useToast();

    const columns = useMemo(() => getStageColumns(), []);

    const filter = useMemo<FilterStagesDTO>(
        () => ({
            call: call._id,
        }),
        [call._id],
    );

    return (
        <ItemManager<Stage, FilterStagesDTO>
            key={call._id}
            api={StageApi}
            resource="stage"
            itemName="Stage"
            headerTitle={`${call.title} Stages`}
            itemIcon={MENU_ICONS.stages}
            columns={columns}
            enableColumnToggle
            defaultHiddenFields={DEFAULT_HIDDEN}
            filter={filter}
            dialogWidth="800px"
            statusField="status"
            transitions={STAGE_TRANSITIONS}
            renderForm={(props) => (
                <StageForm {...props} call={call} />
            )}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Stage created successfully'
                        : 'Stage updated successfully',
                )
            }
        />
    );
}