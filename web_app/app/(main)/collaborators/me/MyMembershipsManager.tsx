'use client';

import { useEffect, useState } from 'react';
import MyBadge from '@/templates/MyBadge';
import EmptyState from '@/components/EmptyState';
import ProjectDetail from '../../projects/components/ProjectDetail';
import {
    ItemDataTable,
    RowActionButton
} from '@/components/data-table/ItemDataTable';
import { useStateTransitionActions } from '@/hooks/useStateTransitionActions';
import { StateTransition } from '@/api/EntityApi';
import { CollaboratorApi } from '../api/collaborator.api';
import { Collaborator } from '../models/collaborator.model';
import { COLLABORATION_TRANSITIONS } from '../models/collaborator.state-machine';

const MyMembershipsManager = () => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        CollaboratorApi.me()
            .then(data => {
                const memberships = Array.isArray(data) ? data : [];

                setCollaborators(
                    memberships.filter(collaborator => !collaborator.isLeadPI)
                );
            })
            .catch(error =>
                console.error('Error fetching my collaborations', error)
            )
            .finally(() => setLoading(false));

    }, []);

    const handleTransition = async (
        id: string,
        transition: StateTransition
    ) => {
        const updated = await CollaboratorApi.transitionState?.(
            id,
            transition
        );

        if (!updated) return;

        setCollaborators(prev =>
            prev.map(item =>
                item._id === id
                    ? { ...item, status: updated.status }
                    : item
            )
        );
    };

    const stateActions: RowActionButton<Collaborator>[] =
        useStateTransitionActions({
            resource: 'collaborator',
            statusField: 'status',
            transitions: COLLABORATION_TRANSITIONS,
            onTransition: handleTransition
        });

    const columns = [
        {
            header: 'Project Title',
            field: 'project.title',
            body: (collaborator: Collaborator) => {
                const project =
                    typeof collaborator.project === 'object'
                        ? collaborator.project
                        : null;

                const title = project?.title ?? 'Unknown Project';

                return (
                    <div
                        className="truncate text-sm font-medium"
                        title={title}
                        style={{ maxWidth: '350px' }}
                    >
                        {title}
                    </div>
                );
            }
        },
        {
            header: 'Role',
            field: 'role',
            sortable: true,
            body: (collaborator: Collaborator) =>
                collaborator.role || 'No Role Assigned'
        },
        {
            header: 'Lead',
            field: 'project.leadPI.name',
            sortable: true,
            body: (collaborator: Collaborator) => {
                const project =
                    typeof collaborator.project === 'object'
                        ? collaborator.project
                        : null;

                return (project?.leadPI as any)?.name ?? 'N/A';
            }
        },
        {
            header: 'Status',
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


    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading memberships...
            </div>
        );
    }

    /*
    if (!collaborators.length) {
        return (
            <EmptyState
                icon="pi pi-users"
                title="No project memberships"
                description="You are not listed as a collaborator on any active projects."
            />
        );
    }*/

    return (
        <ItemDataTable
            items={collaborators}
            columns={columns}
            rowActions={stateActions}
            enableSearch={false}
            emptyTitle="No project memberships"
            emptyDescription="You are not listed as a collaborator on any active projects."
            expandable={{
                template: collaborator => {
                    const projectId =
                        typeof collaborator.project === 'object'
                            ? collaborator.project?._id
                            : collaborator.project;

                    return projectId ? (
                        <ProjectDetail project={projectId} />
                    ) : (
                        <div className="p-3 text-500">
                            No project ID found.
                        </div>
                    );
                }
            }}
        />
    );
};

export default MyMembershipsManager;