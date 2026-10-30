'use client';

import { ColumnProps } from 'primereact/column';
import { useMemo } from 'react';

import {
    ItemManager
} from '@/components/ItemManager';

import { useToast } from '@/contexts/ToastContext';
import { Collaborator, FilterCollaboratorsOptions } from '../models/collaborator.model';
import { CollaboratorApi } from '../api/collaborator.api';

import CollaboratorForm from './CollaboratorForm';
import ProjectDetail from '../../components/ProjectDetail'; // Adjust path if needed based on your folder structure
import { Project, ProjectStatus } from '../../models/project.model';
import { User } from '@/app/(main)/users/models/user.model';
import { MENU_ICONS } from '@/utils/menu-icons';
import { COLLABORATION_TRANSITIONS } from '../models/collaborator.state-machine';
import MyBadge from '@/templates/MyBadge';
import { useAuth } from '@/contexts/auth-context';
import { SpinnerSkeleton } from '@/components/Skeletons';
import { extractId } from '@/utils/utils';

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Project',
        field: 'project.title',
        sortable: true,
        body: (row: Collaborator) => {
            const project =
                typeof row.project === 'object'
                    ? row.project
                    : null;

            const title = project?.title ?? 'Unknown Project';

            return (
                <div
                    className="block max-w-[200px] min-w-0 truncate text-sm font-medium"
                    title={title}
                >
                    {title}
                </div>
            );
        }
    },
    {
        header: 'Name',
        field: 'member.name', // Assuming user object has a 'name' field
        sortable: true
    },
    {
        header: 'Role',
        field: 'role',
        sortable: true,
        style: { width: '180px' }
    },
    {
        header: 'Lead',
        field: 'isLeadPI',
        sortable: true,
        style: { width: '100px', textAlign: 'center' },
        body: (collaborator: Collaborator) => (
            <span
                title={collaborator.isLeadPI ? 'Lead PI' : 'Collaborator'}
                className={
                    collaborator.isLeadPI
                        ? 'text-amber-500 inline-flex items-center justify-center'
                        : 'text-gray-400 inline-flex items-center justify-center'
                }
            >
                <i
                    className={
                        collaborator.isLeadPI
                            ? 'pi pi-star-fill text-sm'
                            : 'pi pi-user text-sm'
                    }
                />
            </span>
        )
    },
    {
        header: 'Project Status',
        field: 'project.status',
        sortable: true,
        body: (collaborator: Collaborator) => {
            const project =
                typeof collaborator.project === 'object' &&
                    collaborator.project !== null
                    ? collaborator.project
                    : null;

            return (
                <MyBadge
                    type="status"
                    value={project?.status ?? 'Unknown'}
                />
            );
        }
    },
    {
        header: 'Invitation',
        field: 'status',
        sortable: true,
        body: (collaborator: Collaborator) => (
            <MyBadge
                type="status"
                value={collaborator.status ?? 'Unknown'}
            />
        )
    }
];


interface CollaboratorManagerProps {
    project?: Project;
    member?: User;
    useLookup?: boolean;
    disableCrud?: boolean;
    enableProjectDetail?: boolean;
}

// Keep the permission ids the user picked: the API response may not echo them back
const mapSaved = (saved: Collaborator, submitted: Partial<Collaborator>): Collaborator => ({
    ...saved,
    member: submitted.member ?? saved.member
});

const CollaboratorManager = ({
    project,
    member,
    useLookup = false,
    disableCrud = false,
    enableProjectDetail = false,
}: CollaboratorManagerProps) => {


    const { getUser, loading } = useAuth();
    const me = getUser();
    // Show loading skeleton while user session hydrates
    if (loading) {
        return (
            <SpinnerSkeleton text='loading current user' />
        );
    }

    const toast = useToast();

    // If you need filters, define them here. Otherwise, pass an empty object or omit.
    const filter = useMemo<FilterCollaboratorsOptions>(() => ({
        project: project,
        member: member
    }), [project, member]);


    const defaultHiddenFields = useMemo(() => {
        const hiddenFields = ['status', 'project.status'];

        if (member) {
            hiddenFields.push('member.name');
        }

        if (project) {
            hiddenFields.push('project.title');
        }

        return hiddenFields;
    }, [member, project]);

    // Define expandable table properties for project details
    const tableProps = useMemo(
        () => ({
            expandable: {
                template: (row: Collaborator) => {
                    const resolvedProject =
                        typeof row.project === 'object' && row.project !== null
                            ? (row.project as Project)
                            : null;

                    if (!resolvedProject) {
                        return <div className="p-3 text-sm text-500">No project details available.</div>;
                    }

                    return (
                        <ProjectDetail
                            project={resolvedProject}
                            useLookup={true}
                            disableCrud={
                                !row.isLeadPI ||
                                resolvedProject.status !== ProjectStatus.draft
                            }
                        />
                    );
                }
            }
        }),
        []
    );

    return (
        <ItemManager<Collaborator, FilterCollaboratorsOptions>
            api={CollaboratorApi}
            useLookup={useLookup}
            resource="collaborator"
            itemName="Collaboration"
            itemIcon={MENU_ICONS.collaborators}
            headerTitle="Collaborations"
            columns={columns}
            defaultHiddenFields={defaultHiddenFields}
            enableColumnToggle
            mapSaved={mapSaved}
            filter={filter}
            hideCreateAction={disableCrud}
            hideEditAction={disableCrud}
            hideDeleteAction={disableCrud}
            dialogWidth="500px"
            renderForm={
                disableCrud
                    ? undefined
                    : (props) => (
                        <CollaboratorForm {...props} project={project} />
                    )
            }
            statusField="status"
            transitions={
                COLLABORATION_TRANSITIONS
            }
            hideTransition={(row) =>
                extractId(row.member) !== extractId(me)
            }
            tableProps={enableProjectDetail ? tableProps : undefined}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Collaborator added successfully'
                        : 'Collaborator updated successfully'
                )
            }
        />
    );
};

export default CollaboratorManager;