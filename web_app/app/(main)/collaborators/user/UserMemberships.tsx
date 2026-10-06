'use client';

import { useEffect, useState } from 'react';
import MyBadge from '@/templates/MyBadge';
import ProjectDetail from '../../projects/components/ProjectDetail';
import { ItemDataTable } from '@/components/data-table/ItemDataTable';
import { CollaboratorApi } from '../api/collaborator.api';
import { Collaborator } from '../models/collaborator.model';

interface UserMembershipsProps {
    user: string | { _id?: string; id?: string;[key: string]: any };
}

const UserMemberships = ({ user }: UserMembershipsProps) => {
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Extract ID whether user is a string or an object containing an ID
        const userId = typeof user === 'string' ? user : (user?._id || user?.id);

        if (!userId) {
            setCollaborators([]);
            setLoading(false);
            return;
        }

        CollaboratorApi.getAll({ member: userId })
            .then(data => {
                const memberships = Array.isArray(data) ? data : [];
                setCollaborators(memberships);
            })
            .catch(error =>
                console.error('Error fetching collaborations for user', error)
            )
            .finally(() => setLoading(false));
    }, [user]);

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
                    <div className="flex items-center gap-2">
                        {collaborator.isLeadPI && (
                            <span
                                title="Lead PI / User Project"
                                className="text-amber-500 flex items-center"
                            >
                                <i className="pi pi-star-fill text-xs" />
                            </span>
                        )}
                        <div
                            className="truncate text-sm font-medium"
                            title={title}
                            style={{ maxWidth: '350px' }}
                        >
                            {title}
                        </div>
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
            header: 'Membership Status',
            field: 'status',
            sortable: true,
            body: (collaborator: Collaborator) => (
                <MyBadge
                    type="status"
                    value={collaborator.status ?? 'Unknown'}
                />
            )
        },
        {
            header: 'Project Status',
            field: 'project.status',
            sortable: true,
            body: (collaborator: Collaborator) => {
                const project =
                    typeof collaborator.project === 'object'
                        ? collaborator.project
                        : null;

                return (
                    <MyBadge
                        type="status"
                        value={project?.status ?? 'Unknown'}
                    />
                );
            }
        }
    ];

    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading memberships...
            </div>
        );
    }

    return (
        <ItemDataTable
            items={collaborators}
            columns={columns}
            rowActions={[]}
            enableSearch={false}
            emptyTitle="No project memberships"
            emptyDescription="This user is not listed as a collaborator on any projects."
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

export default UserMemberships;