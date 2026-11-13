'use client';

import { ColumnProps } from 'primereact/column';
import { useEffect, useMemo, useState } from 'react';

import {
    ItemManager
} from '@/components/ItemManager';

import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import { PhaseApi } from '../api/phase.api';
import { FilterPhasesOptions, Phase, PhaseStatus } from '../models/phase.model';
import PhaseForm from './PhaseForm';

import { Project } from '@/app/(main)/projects/models/project.model';
import MyBadge from '@/templates/MyBadge';
import { etbCurrencyFormatter, formatDate } from '@/utils/utils';
import { PHASE_TRANSITIONS } from '../models/phase.state-machine';
import { RowActionButton } from '@/components/data-table/ItemDataTable';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { ValidationDialog } from '@/components/ValidationDialog';
import { DocumentTemplateApi } from '@/app/(main)/documentTemplates/api/documentTemplate.api';

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
            formatDate(phase.startDate)
    },
    {
        header: 'End Date',
        field: 'endDate',
        sortable: true,
        body: (phase: Phase) =>
            formatDate(phase.endDate)
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
    const {
        error,
        validationResult,
        handleError,
        clearErrors
    } = useValidationErrors();

    // Plain (non-validation) errors still go to the toast
    useEffect(() => {
        if (error) {
            toast.error(error);
            clearErrors();
        }
    }, [error, toast, clearErrors]);

    const filter = useMemo<FilterPhasesOptions>(
        () => ({
            project
        }),
        [project]
    );

    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const extraRowActions = useMemo<RowActionButton<Phase>[]>(
        () => [
            {
                icon: 'pi pi-file-pdf',
                severity: 'success',
                tooltip: 'Generate Agreement PDF',
                disabled: (row: Phase) =>
                    row.status !== PhaseStatus.active ||
                    generatingId === row._id,

                onClick: async (row: Phase) => {
                    if (!row._id) return;

                    // Open synchronously to avoid popup blockers.
                    const newWindow = window.open("", "_blank");

                    try {
                        setGeneratingId(row._id);

                        const blob = await DocumentTemplateApi.generate(row._id);

                        const blobUrl = window.URL.createObjectURL(blob);

                        if (newWindow) {
                            newWindow.location.href = blobUrl;
                        } else {
                            window.open(blobUrl, "_blank");
                        }

                        setTimeout(() => {
                            window.URL.revokeObjectURL(blobUrl);
                        }, 60000);

                    } catch (error) {
                        newWindow?.close();

                        console.error("Failed to generate agreement PDF", error);

                        toast.error(
                            error instanceof Error
                                ? error.message
                                : "Failed to generate agreement PDF"
                        );
                    } finally {
                        setGeneratingId(null);
                    }
                }
            }
        ],
        [generatingId, toast]
    );


    return (
        <>
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
                extraRowActions={extraRowActions}
                onError={handleError}
                onSuccess={(operation) =>
                    toast.success(
                        operation === 'create'
                            ? 'Phase created successfully'
                            : 'Phase updated successfully'
                    )
                }
            />
            <ValidationDialog
                header="Cannot save phase"
                validationResult={validationResult}
                onHide={clearErrors}
            />
        </>
    );
};

export default PhaseManager;