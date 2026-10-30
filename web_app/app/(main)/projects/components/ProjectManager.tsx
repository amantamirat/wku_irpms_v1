
'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import MyBadge from '@/templates/MyBadge';
import { etbCurrencyFormatter } from '@/utils/utils';

import { ProjectApi } from '../api/project.api';
import { FilterProjects, Project, ProjectStatus } from '../models/project.model';
import { PROJECT_TRANSITIONS } from '../models/project.state-machine';
import ProjectDetail from './ProjectDetail';
import ProjectForm from './ProjectForm';
import { MENU_ICONS } from '@/utils/menu-icons';
import { useToast } from '@/contexts/ToastContext';

const getReference = (
    value: unknown
): Record<string, unknown> | null =>
    value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : null;

const getReferenceLabel = (
    value: unknown,
    field: string,
    fallback = 'N/A'
): string => {
    const reference = getReference(value);

    if (reference?.[field] != null) {
        return String(reference[field]);
    }

    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : fallback;
};

const truncateStyle = {
    maxWidth: '220px'
} as const;

const columns: ColumnProps[] = [
    {
        header: 'Grant',
        field: 'grant.title',
        sortable: true,
        body: (row: Project) => {
            const title = getReferenceLabel(row.grant, 'title');

            return (
                <div
                    className="truncate text-sm font-medium text-700"
                    title={title}
                    style={truncateStyle}
                >
                    {title}
                </div>
            );
        }
    },
    {
        header: 'Call',
        field: 'call.title',
        sortable: true,
        body: (row: Project) => {
            const title = getReferenceLabel(row.call, 'title');

            return (
                <div
                    className="truncate text-sm font-medium text-700"
                    title={title}
                    style={truncateStyle}
                >
                    {title}
                </div>
            );
        }
    },
    {
        header: 'Calendar',
        field: 'calendar.year',
        sortable: true,
        body: (row: Project) => (
            <span className="text-600 font-medium">
                {getReferenceLabel(row.calendar, 'year')}
            </span>
        )
    },
    {
        header: 'Organization',
        field: 'organization.name',
        sortable: true,
        body: (row: Project) => (
            <span className="text-600">
                {getReferenceLabel(row.organization, 'name')}
            </span>
        )
    },
    {
        header: 'Workspace',
        field: 'workspace.name',
        sortable: true,
        body: (row: Project) => (
            <span className="text-600">
                {getReferenceLabel(row.workspace, 'name')}
            </span>
        )
    },
    {
        header: 'Title',
        field: 'title',
        sortable: true,
        body: (row: Project) => (
            <div
                className="font-medium text-900 truncate text-sm"
                style={{ maxWidth: '250px' }}
                title={row.title}
            >
                {row.title || 'Untitled Project'}
            </div>
        )
    },
    {
        header: 'Lead',
        field: 'leadPI.name',
        sortable: true,
        body: (row: Project) => (
            <span className="text-700 font-medium">
                {getReferenceLabel(row.leadPI, 'name')}
            </span>
        )
    },
    {
        header: 'Gender',
        field: 'leadPI.gender',
        sortable: true,
        body: (row: Project) => (
            <MyBadge
                type="gender"
                value={getReferenceLabel(row.leadPI, 'gender')}
            />
        )
    },
    {
        header: 'Female Proportion',
        field: 'femaleProportion',
        sortable: true,
        body: (row: Project) =>
            typeof row.femaleProportion === 'number'
                ? `${row.femaleProportion.toFixed(2)}%`
                : 'N/A'
    },
    {
        header: 'Verification Proportion',
        field: 'verifiedCollaboratorsProportion',
        sortable: true,
        body: (row: Project) =>
            typeof row.verifiedCollaboratorsProportion === 'number'
                ? `${row.verifiedCollaboratorsProportion.toFixed(2)}%`
                : 'N/A'
    },
    {
        header: 'Budget',
        field: 'totalBudget',
        sortable: true,
        body: (row: Project) => (
            <span className="font-semibold text-900">
                {typeof row.totalBudget === 'number'
                    ? etbCurrencyFormatter.format(row.totalBudget)
                    : 'N/A'}
            </span>
        )
    },
    {
        header: 'Application Status',
        field: 'currentApplication.status',
        sortable: true,
        body: (row: Project) => {
            const application = getReference(row.currentApplication);

            return (
                <MyBadge
                    type="status"
                    value={String(application?.status ?? 'N/A')}
                />
            );
        }
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        body: (row: Project) => (
            <MyBadge
                type="status"
                value={row.status ?? 'Unknown'}
            />
        )
    }
];

const defaultHiddenFields = [
    'grant.title',
    'calendar.year',
    'leadPI.gender',
    'currentApplication.status',
    'femaleProportion',
    'verifiedCollaboratorsProportion',
    'organization.name',
    'workspace.name',
    'call.title',
    'totalBudget',
    'status'
];

interface ProjectManagerProps {
    status?: ProjectStatus;
}

const ProjectManager = ({
    status
}: ProjectManagerProps) => {
    const toast = useToast();

    const tableProps = useMemo(
        () => ({
            expandable: {
                template: (project: Project) => (
                    <ProjectDetail
                        project={project}
                    />
                )
            }
        }),
        []
    );

    const filter = useMemo<FilterProjects>(() => ({
        status
    }), [status]);

    return (
        <ItemManager<Project, FilterProjects>
            api={ProjectApi}
            filter={filter}
            resource="project"
            itemName="Project"
            headerTitle="Manage Projects"
            itemIcon={MENU_ICONS.projects}
            columns={columns}
            renderForm={(props) => (
                <ProjectForm {...props} />
            )}
            dialogWidth="900px"
            enableColumnToggle={true}
            defaultHiddenFields={defaultHiddenFields}
            statusField="status"
            transitions={PROJECT_TRANSITIONS}
            tableProps={tableProps}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Project created successfully'
                        : 'Project updated successfully'
                )
            }
        />
    );
};

export default ProjectManager;
