'use client';

import { BASE_URL } from '@/api/ApiClient';
import { RowActionButton } from '@/components/data-table/ItemDataTable';
import { ItemManager, ItemManagerHandle } from '@/components/ItemManager';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/contexts/ToastContext';
import MyBadge from '@/templates/MyBadge';
import { FilterMatchMode } from 'primereact/api';
import { ColumnProps } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { useCallback, useMemo, useRef } from 'react';
import { Stage } from '../../calls/stages/models/stage.model';
import { ApplicationApi } from '../api/application.api';
import { useApplicationAnonymizer } from '../hooks/useApplicationAnonymizer';
import { useReviewerAssigner } from '../hooks/useReviewerAssigner';
import {
    AnonymizationStatus,
    Application,
    ApplicationStatus,
    FilterApplicationOptions,
} from '../models/application.model';
import { APPLICATION_TRANSITIONS } from '../models/application.state-machine';
import ApplicationDetail from './ApplicationDetail';
import { ApplicationAnonymizeDialog } from './dialogs/ApplicationAnonymizeDialog';
import { ReviewerAssignerDialog } from './dialogs/ReviewerAssignerDialog';
import { MENU_ICONS } from '@/utils/menu-icons';
import { Project } from '../../projects/models/project.model';
import ApplicationForm from './ApplicationForm';

/* -------------------------------------------------------------------------- */
/*                         Columns (static, module level)                     */
/* -------------------------------------------------------------------------- */

const getProject = (row: Application) =>
    typeof row.project === 'object' && row.project !== null ? row.project : null;

const percentColumn = (
    header: string,
    key: 'femaleProportion' | 'verifiedCollaboratorsProportion'
): ColumnProps => ({
    header,
    field: `project.${key}`,
    sortable: true,
    body: (row: Application) => {
        const value = (getProject(row) as any)?.[key];
        return (
            <span className="text-xs text-gray-600">
                {typeof value === 'number' ? `${value.toFixed(2)}%` : '—'}
            </span>
        );
    },
});

const docColumn = (
    header: string,
    field: string,
    getPath: (row: Application) => string | undefined,
    linkClass: string,
    iconClass: string,
    emptyLabel: string
): ColumnProps => ({
    header,
    field,
    body: (row: Application) => {
        const path = getPath(row);
        return path ? (
            <a
                href={`${BASE_URL}/uploads/${path.replace(/^\/+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-medium hover:underline ${linkClass}`}
            >
                <i className={`pi pi-file-pdf text-sm ${iconClass}`} />
                <span>View PDF</span>
            </a>
        ) : (
            <span className="text-gray-400 text-xs italic">{emptyLabel}</span>
        );
    },
});

const COLUMNS: ColumnProps[] = [
    {
        header: 'Project',
        field: 'project.title',
        sortable: true,
        body: (row: Application) => {
            const title = getProject(row)?.title ?? 'Unknown Project';
            return (
                <div
                    className="truncate text-sm font-medium"
                    title={title}
                    style={{ maxWidth: '350px' }}
                >
                    {title}
                </div>
            );
        },
    },
    {
        header: 'Lead PI',
        field: 'project.leadPI.name',
        sortable: true,
        body: (row: Application) => {
            const leadPI = getProject(row)?.leadPI;
            return typeof leadPI === 'object' && leadPI !== null
                ? leadPI.name
                : 'Unknown Lead PI';
        },
    },
    percentColumn('Female Proportion', 'femaleProportion'),
    percentColumn('Verified Collaborators', 'verifiedCollaboratorsProportion'),
    docColumn('Orig Doc', 'origDoc', (a) => a.documentPath,
        'text-blue-600 hover:text-blue-800', 'text-red-500', 'No document'),
    docColumn('Anon Doc', 'anonDoc', (a) => a.anonymizedDocumentPath,
        'text-emerald-600 hover:text-emerald-800', 'text-emerald-500', 'N/A'),
    {
        header: 'Score',
        field: 'totalScore',
        sortable: true,
        body: (a: Application) => (
            <span className="font-bold text-sm">
                {typeof a.totalScore === 'number' ? a.totalScore.toFixed(2) : '—'}
            </span>
        ),
    },
    {
        header: 'Submitted At',
        field: 'createdAt',
        sortable: true,
        body: (a: Application) => (
            <span className="text-sm">
                {a.createdAt
                    ? new Date(a.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                    })
                    : '—'}
            </span>
        ),
    },
    {
        header: 'Reviewer Assigner',
        field: 'assigner',
        body: (row: Application) => {
            const assigner = row.reviewerAssigner;
            const name =
                typeof assigner === 'object' && assigner !== null
                    ? (assigner as any).name
                    : assigner
                        ? 'Assigned User'
                        : null;

            return name ? (
                <span className="inline-flex align-items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border-round text-xs font-medium">
                    <i className="pi pi-user text-xs" />
                    {name}
                </span>
            ) : (
                <span className="text-gray-400 text-xs italic">Unassigned</span>
            );
        },
    },
    {
        header: 'Status',
        field: 'status',
        filterField: 'status',
        sortable: true,
        filter: true,
        filterMatchMode: FilterMatchMode.EQUALS,
        showFilterMatchModes: false,
        showApplyButton: false,
        showClearButton: false,
        filterElement: (options) => (
            <Dropdown
                value={options.value}
                options={Object.values(ApplicationStatus).map((status) => ({
                    label: status,
                    value: status,
                }))}
                // Renders each option in the dropdown list using MyBadge
                itemTemplate={(option) => {
                    if (!option) return null;
                    return <MyBadge type="status" value={option.value} />;
                }}
                // Renders the selected value in the dropdown header using MyBadge
                valueTemplate={(option, props) => {
                    if (option) {
                        return <MyBadge type="status" value={option.value} />;
                    }
                    return <span className="text-gray-400">{props.placeholder}</span>;
                }}
                onChange={(e) => {
                    options.filterApplyCallback(e.value ?? null);
                }}
                placeholder="Filter by status"
                showClear
                className="p-column-filter"
            />
        ),
        body: (a: Application) => <MyBadge type="status" value={a.status} />,
    },
];

const DEFAULT_HIDDEN = [
    'project.femaleProportion',
    'project.verifiedCollaboratorsProportion',
    'assigner',
    'origDoc',
    'anonDoc',
    'project.leadPI.name',
    'createdAt'
];

/* -------------------------------------------------------------------------- */
/*                              ApplicationManager                            */
/* -------------------------------------------------------------------------- */

interface ApplicationManagerProps {
    project?: Project;
    stage?: Stage;
    useLookup?: boolean;
    disableCrud?: boolean;
    enableDetail?: boolean;
}

const ApplicationManager = ({ project, stage, useLookup = false, disableCrud = false, enableDetail = false }: ApplicationManagerProps) => {
    const { hasPermission } = useAuth();
    const toast = useToast();

    const manager = useRef<ItemManagerHandle<Application>>(null);

    // Table update helpers
    const patch = useCallback(
        (id: string, changes: Partial<Application>) => {
            manager.current?.patchItem(id, changes);
        },
        []
    );

    const replace = useCallback((application: Application) => {
        manager.current?.updateItem(application);
    }, []);

    // Independent workflows
    const assigner = useReviewerAssigner(patch);
    const anonymizer = useApplicationAnonymizer(patch);

    // Additional row actions
    const extraRowActions = useMemo<RowActionButton<Application>[]>(
        () => [
            {
                icon: 'pi pi-user-plus',
                severity: 'info',
                tooltip: 'Manage Reviewer Assigner',
                visible: () =>
                    hasPermission('application:reviewerAssigner:update'),
                disabled: application =>
                    application.status !== ApplicationStatus.shortlisted,
                onClick: assigner.open
            },
            {
                icon: 'pi pi-eye-slash',
                severity: 'warning',
                tooltip: 'Anonymize Document',
                visible: () =>
                    hasPermission('application:anonymize'),
                disabled: application =>
                    application.anonymizationStatus ===
                    AnonymizationStatus.processing,
                onClick: anonymizer.open
            }
        ],
        [hasPermission, assigner.open, anonymizer.open]
    );

    // Table configuration
    const tableProps = useMemo(
        () => ({
            enableSearch: true,
            expandable: {
                template: (application: Application) => (
                    <ApplicationDetail
                        application={application}
                        updateApplication={replace}
                    />
                )
            }
        }),
        [replace]
    );

    const filter = useMemo<FilterApplicationOptions>(() => ({
        project: project,
        stage: stage
    }), [project, stage]);

    return (
        <>
            <ItemManager<Application, FilterApplicationOptions>
                managerRef={manager}
                api={ApplicationApi}
                useLookup={useLookup}
                resource="application"
                itemName="Application"
                itemIcon={MENU_ICONS.applications}
                filter={filter}
                columns={COLUMNS}
                enableColumnToggle
                defaultHiddenFields={DEFAULT_HIDDEN}
                dialogWidth='700px'
                renderForm={
                    disableCrud
                        ? undefined
                        : (props) => (
                            <ApplicationForm
                                {...props}
                                project={project}
                            />
                        )
                }
                hideCreateAction={disableCrud}
                hideEditAction={true}
                hideDeleteAction={disableCrud}
                statusField="status"
                transitions={enableDetail ? APPLICATION_TRANSITIONS : undefined}
                extraRowActions={enableDetail ? extraRowActions : undefined}
                tableProps={enableDetail ? tableProps : undefined}
                onError={(error, operation) =>
                    toast.error(error, operation)
                }
            />

            {/* Reviewer assignment */}
            <ReviewerAssignerDialog
                {...assigner.dialogProps}
            />

            {/* Application anonymization */}
            <ApplicationAnonymizeDialog
                {...anonymizer.dialogProps}
            />
        </>
    );
};

export default ApplicationManager;