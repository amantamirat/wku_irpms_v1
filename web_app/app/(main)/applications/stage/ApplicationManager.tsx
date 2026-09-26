// ApplicationManager.tsx
'use client';

import { BASE_URL } from '@/api/ApiClient';
import {
    StateTransition
} from '@/api/EntityApi';
import {
    ItemDataTable,
    RowActionButton
} from '@/components/data-table/ItemDataTable';
import { useConfirmDialog } from '@/contexts/ConfirmDialogContext';
import { useAuth } from '@/contexts/auth-context';
import { useStateTransitionActions } from '@/hooks/useStateTransitionActions';
import MyBadge from '@/templates/MyBadge';
import { useEffect, useState } from 'react';
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
import { UserApi } from '../../users/api/user.api';
import { ReviewerAssignerDialog } from './ReviewerAssignerDialog';

interface ApplicationManagerProps {
    stage: Stage;
}

const ApplicationManager = ({ stage }: ApplicationManagerProps) => {
    const confirm = useConfirmDialog();
    const { hasPermission } = useAuth();

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state for Reviewer Assigner
    const [assignerDialogVisible, setAssignerDialogVisible] = useState(false);
    const [activeApplication, setActiveApplication] = useState<Application | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [savingAssigner, setSavingAssigner] = useState(false);
    const [dialogError, setDialogError] = useState<string | null>(null);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!stage) return;

            setLoading(true);

            try {
                const data = await ApplicationApi.getAll({ stage });
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

    // Fetch users when the dialog opens
    const handleOpenAssignerDialog = async (application: Application) => {
        setActiveApplication(application);
        const currentAssignerId = typeof application.reviewerAssigner === 'object'
            ? (application.reviewerAssigner as any)?._id
            : application.reviewerAssigner;

        setSelectedUserId(currentAssignerId || null);
        setDialogError(null);
        setAssignerDialogVisible(true);

        if (users.length === 0) {
            try {
                const userData = await UserApi.lookup!();
                setUsers(Array.isArray(userData) ? userData : []);
            } catch (err) {
                console.error("Failed to fetch users list", err);
                setDialogError("Failed to load user list.");
            }
        }
    };

    const handleSaveAssigner = async () => {
        if (!activeApplication?._id) return;

        setSavingAssigner(true);
        setDialogError(null);

        try {
            const updated = await ApplicationApi.updateReviewerAssigner(
                activeApplication._id,
                selectedUserId
            );

            setApplications(prev =>
                prev.map(app =>
                    app._id === activeApplication._id
                        ? { ...app, reviewerAssigner: updated.reviewerAssigner }
                        : app
                )
            );

            setAssignerDialogVisible(false);
        } catch (error: any) {
            console.error("Failed to update reviewer assigner", error);
            setDialogError(error?.message || "Failed to update reviewer assigner. Please try again.");
        } finally {
            setSavingAssigner(false);
        }
    };

    const updateApplication = (updated: Application) => {
        setApplications(prev =>
            prev.map(application =>
                application._id === updated._id
                    ? updated
                    : application
            )
        );
    };

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
            body: (row: Application) => {
                const project =
                    typeof row.project === 'object'
                        ? row.project
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
            field: 'origDoc',
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
            field: 'anonDoc',
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
                        ? application.totalScore.toFixed(2)
                        : '—'}
                </span>
            )
        },
        {
            header: 'Reviewer Assigner',
            field: "assigner",
            body: (row: Application) => {
                const assigner = row.reviewerAssigner;
                const assignerName = typeof assigner === 'object' && assigner !== null
                    ? (assigner as any).name
                    : (assigner ? 'Assigned User' : null);

                return assignerName ? (
                    <span className="inline-flex align-items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border-round text-xs font-medium">
                        <i className="pi pi-user text-xs"></i>
                        {assignerName}
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs italic">Unassigned</span>
                );
            }
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
            icon: 'pi pi-user-plus',
            severity: 'info',
            tooltip: 'Manage Reviewer Assigner',
            visible: () => hasPermission("application:reviewerAssigner:update"),
            onClick: (row: Application) => handleOpenAssignerDialog(row)
        },
        {
            icon: 'pi pi-eye-slash',
            severity: 'warning',
            tooltip: 'Anonymize Document',
            visible: () => hasPermission("application:anonymize"),
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
        <>
            <ItemDataTable
                items={applications}
                columns={columns}
                rowActions={[
                    ...stateActions,
                    ...extraActions
                ]}
                enableSearch
                enableColumnToggle
                defaultHiddenFields={["assigner", "origDoc", "anonDoc"]}
                expandable={{
                    template: application => (
                        <ApplicationDetail
                            application={application}
                            updateApplication={updateApplication}
                        />
                    )
                }}
            />

            {/* Separated Reviewer Assigner Dialog Component */}
            <ReviewerAssignerDialog
                visible={assignerDialogVisible}
                onHide={() => setAssignerDialogVisible(false)}
                users={users}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                onSave={handleSaveAssigner}
                saving={savingAssigner}
                errorMessage={dialogError}
            />
        </>
    );
};

export default ApplicationManager;