'use client';

import { useEffect, useState } from 'react';
import { BASE_URL } from '@/api/ApiClient';
import MyBadge from '@/templates/MyBadge';
import EmptyState from '@/components/EmptyState';
import {
    ItemDataTable,
    RowActionButton
} from '@/components/data-table/ItemDataTable';
import {
    StateTransition
} from '@/api/EntityApi';
import { useStateTransitionActions } from '@/hooks/useStateTransitionActions';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { Stage } from '../../calls/stages/models/stage.model';
import { ApplicationApi } from '../api/application.api';
import {
    AnonymizationStatus,
    Application
} from '../models/application.model';
import {
    APPLICATION_TRANSITIONS
} from '../models/application.state-machine';
import ApplicationDetail from './ApplicationDetail';
import { useAuth } from '@/contexts/auth-context';

interface ApplicationManagerProps {
    stage: Stage;
}

const ApplicationManager = ({ stage }: ApplicationManagerProps) => {
    const confirm = useConfirmDialog();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    const { hasPermission } = useAuth();

    useEffect(() => {
        const fetchApplications = async () => {
            if (!stage) return;

            setLoading(true);

            try {
                const data = await ApplicationApi.getAll({ stage }, true);
                setApplications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(
                    'Error fetching applications for stage:',
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [stage]);

    const handleTransition = async (
        id: string,
        transition: StateTransition
    ) => {
        const updated = await ApplicationApi.transitionState?.(
            id,
            transition
        );

        if (!updated) return;

        setApplications(prev =>
            prev.map(item =>
                item._id === id
                    ? {
                        ...item,
                        status: updated.status
                    }
                    : item
            )
        );
    };

    const stateActions: RowActionButton<Application>[] =
        useStateTransitionActions({
            resource: 'application',
            statusField: 'status',
            transitions: APPLICATION_TRANSITIONS,
            onTransition: handleTransition
        });

    const columns = [
        {
            header: 'Project',
            field: 'project.title',
            sortable: true,
            body: (application: Application) => {
                const project =
                    typeof application.project === 'object'
                        ? application.project
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
            header: 'Orig Doc',
            body: (application: Application) =>
                application.documentPath ? (
                    <a
                        href={`${BASE_URL}/${application.documentPath.replace(
                            /^\\/,
                            ''
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                        <i className="pi pi-file-pdf text-red-500 text-sm" />
                        <span>View PDF</span>
                    </a>
                ) : (
                    <span className="text-gray-400 text-xs italic">
                        No document
                    </span>
                )
        },
        {
            header: 'Anon Doc',
            body: (application: Application) =>
                application.anonymizedDocumentPath ? (
                    <a
                        href={`${BASE_URL}/${application.anonymizedDocumentPath.replace(
                            /^\\/,
                            ''
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline"
                    >
                        <i className="pi pi-file-pdf text-emerald-500 text-sm" />
                        <span>View PDF</span>
                    </a>
                ) : (
                    <span className="text-gray-400 text-xs italic">
                        N/A
                    </span>
                )
        },
        {
            header: 'Score',
            field: 'totalScore',
            sortable: true,
            body: (application: Application) => (
                <span className="font-bold text-sm">
                    {typeof application.totalScore === 'number'
                        ? application.totalScore
                        : '—'}
                </span>
            )
        },
        {
            header: 'Status',
            field: 'status',
            sortable: true,
            body: (application: Application) => (
                <MyBadge
                    type="status"
                    value={application.status}
                />
            )
        }
    ];

    const extraActions: RowActionButton<Application>[] = [
        {
            icon: 'pi pi-eye-slash',
            //: 'Anonymize Document',
            severity: 'warning',
            tooltip: 'Anonymize Document',
            visible: () => { return hasPermission("application:anonymize") },

            disabled: (row: Application) =>
                row.anonymizationStatus !==
                AnonymizationStatus.pending,

            onClick: (row: Application) => {
                confirm.ask({
                    operation: 'anonymize document',
                    onConfirm: async () => {
                        const updated =
                            await ApplicationApi.anonymize(row._id!);

                        setApplications(prev =>
                            prev.map(app =>
                                app._id === row._id
                                    ? {
                                        ...app,
                                        anonymizationStatus:
                                            updated.anonymizationStatus,
                                        anonymizedDocumentPath:
                                            updated.anonymizedDocumentPath
                                    }
                                    : app
                            )
                        );
                    }
                });
            }
        }
    ];

    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading applications...
            </div>
        );
    }

    return (
        <ItemDataTable
            items={applications}
            columns={columns}
            rowActions={[
                ...stateActions,
                ...extraActions
            ]}
            enableSearch
            expandable={{
                template: application => (
                    <ApplicationDetail
                        application={application}
                    />
                )
            }}
        />
    );
};

export default ApplicationManager;