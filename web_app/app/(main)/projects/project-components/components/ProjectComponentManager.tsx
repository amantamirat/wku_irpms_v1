
'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import ProjectComponentForm from './ProjectComponentForm';

import { Project } from '@/app/(main)/projects/models/project.model';
import { User } from '@/app/(main)/users/models/user.model';
import { ProjectComponentApi } from '../api/component.api';
import { ProjectComponentDTO, FilterProjectComponents } from '../models/component.model';

const getUserName = (user?: string | User) => {
    if (!user) return '—';

    if (typeof user === 'string') return user;

    return user.name || '—';
};

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Title',
        field: 'title',
        sortable: true,
        body: (row: ProjectComponentDTO) => (
            <span className="font-medium">
                {row.title}
            </span>
        )
    },
    {
        header: 'Description',
        field: 'description',
        sortable: true,
        body: (row: ProjectComponentDTO) => (
            <span className="text-600 text-sm">
                {row.description
                    ? row.description.length > 50
                        ? `${row.description.substring(0, 50)}...`
                        : row.description
                    : '—'}
            </span>
        )
    },
    {
        header: 'Investigator',
        field: 'investigator',
        sortable: false,
        body: (row: ProjectComponentDTO) => (
            <span className="text-sm">
                {getUserName(row.investigator)}
            </span>
        )
    },
    {
        header: 'Contributors',
        field: 'contributors',
        sortable: false,
        body: (row: ProjectComponentDTO) => (
            <span className="text-sm">
                {row.contributors?.length
                    ? row.contributors
                        .map((user: User) => getUserName(user))
                        .join(', ')
                    : '—'}
            </span>
        )
    }
];

const defaultHiddenFields = ['description', 'contributors'];

interface ProjectComponentManagerProps {
    project?: Project;
    useLookup?: boolean;
    disableCrud?: boolean;
}

const ProjectComponentManager = ({
    project,
    useLookup = false,
    disableCrud = false
}: ProjectComponentManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterProjectComponents>(
        () => ({
            project: project
        }),
        [project]
    );

    return (
        <ItemManager<ProjectComponentDTO, FilterProjectComponents>
            api={ProjectComponentApi}
            useLookup={useLookup}
            resource="projectComponent"
            itemName="Component"
            itemIcon={MENU_ICONS.components}
            headerTitle="Manage Project Components"
            columns={columns}
            filter={filter}
            dialogWidth="720px"
            enableColumnToggle
            defaultHiddenFields={defaultHiddenFields}
            hideCreateAction={disableCrud}
            hideEditAction={disableCrud}
            hideDeleteAction={disableCrud}
            renderForm={
                disableCrud
                    ? undefined
                    : (props) => (
                        <ProjectComponentForm
                            {...props}
                            project={project}
                        />
                    )
            }
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Project component created successfully'
                        : 'Project component updated successfully'
                )
            }
        />
    );
};

export default ProjectComponentManager;
