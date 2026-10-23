// ApplicationManager.tsx
'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { ColumnProps } from 'primereact/column';
import { BASE_URL } from '@/api/ApiClient';
import { RowActionButton } from '@/components/data-table/ItemDataTable';
import { ItemManager, ItemManagerHandle } from '@/components/ItemManager';
import { useAuth } from '@/contexts/auth-context';
import MyBadge from '@/templates/MyBadge';
import { Stage } from '../../calls/stages/models/stage.model';
import { UserApi } from '../../users/api/user.api';
import { ApplicationApi } from '../api/application.api';
import {
    AnonymizationStatus,
    Application,
    ApplicationStatus,
} from '../models/application.model';
import { APPLICATION_TRANSITIONS } from '../models/application.state-machine';
import ApplicationDetail from './ApplicationDetail';
import { ReviewerAssignerDialog } from './ReviewerAssignerDialog';
import { ApplicationAnonymizeDialog } from './ApplicationAnonymizeDialog';
import { useToast } from '@/contexts/ToastContext';

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
        sortable: true,
        body: (a: Application) => <MyBadge type="status" value={a.status} />,
    },
];

const DEFAULT_HIDDEN = [
    'project.femaleProportion',
    'project.verifiedCollaboratorsProportion',
    'assigner',
    'origDoc',
    'anonDoc',
    'project.leadPI.name'
];

/* -------------------------------------------------------------------------- */
/*                       Local dialog flows (one hook each)                   */
/* -------------------------------------------------------------------------- */

type Patch = (id: string, patch: Partial<Application>) => void;

function useReviewerAssigner(patch: Patch) {
    const [visible, setVisible] = useState(false);
    const [target, setTarget] = useState<Application | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const usersLoaded = useRef(false);

    const open = useCallback(async (application: Application) => {
        const current = application.reviewerAssigner as any;
        setTarget(application);
        setSelectedUserId((typeof current === 'object' ? current?._id : current) || null);
        setError(null);
        setVisible(true);

        if (!usersLoaded.current) {
            try {
                const data = await UserApi.getEligibleApplicationAssignees!();
                setUsers(Array.isArray(data) ? data : []);
                usersLoaded.current = true;
            } catch (err) {
                console.error('Failed to fetch users list', err);
                setError('Failed to load user list.');
            }
        }
    }, []);

    const close = useCallback(() => setVisible(false), []);

    const save = useCallback(async () => {
        if (!target?._id) return;
        setSaving(true);
        setError(null);
        try {
            const updated = await ApplicationApi.updateReviewerAssigner(target._id, selectedUserId);
            patch(target._id, { reviewerAssigner: updated.reviewerAssigner });
            setVisible(false);
        } catch (err: any) {
            console.error('Failed to update reviewer assigner', err);
            setError(err?.message || 'Failed to update reviewer assigner. Please try again.');
        } finally {
            setSaving(false);
        }
    }, [target, selectedUserId, patch]);

    return {
        open,
        dialogProps: {
            visible,
            onHide: close,
            users,
            selectedUserId,
            setSelectedUserId,
            onSave: save,
            saving,
            errorMessage: error,
        },
    };
}

function useAnonymize(patch: Patch) {
    const [visible, setVisible] = useState(false);
    const [target, setTarget] = useState<Application | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const open = useCallback((application: Application) => {
        setTarget(application);
        setError(null);
        setVisible(true);
    }, []);

    const close = useCallback(() => setVisible(false), []);

    const anonymize = useCallback(
        async (manualIdentifiers: string[]) => {
            if (!target?._id) return;
            setSaving(true);
            setError(null);
            try {
                const updated = await ApplicationApi.anonymize(target._id, manualIdentifiers);
                patch(target._id, updated);
                setVisible(false);
                setTarget(null);
            } catch (err: any) {
                setError(err?.message || 'Failed to anonymize the application document.');
            } finally {
                setSaving(false);
            }
        },
        [target, patch]
    );

    return {
        open,
        dialogProps: {
            visible,
            onHide: close,
            identifiers: target?.manualIdentifiers ?? [],
            onAnonymize: anonymize,
            saving,
            errorMessage: error,
        },
    };
}

/* -------------------------------------------------------------------------- */
/*                              ApplicationManager                            */
/* -------------------------------------------------------------------------- */

interface ApplicationManagerProps {
    stage: Stage;
}

const ApplicationManager = ({ stage }: ApplicationManagerProps) => {
    const { hasPermission } = useAuth();
    const toast = useToast();
    const manager = useRef<ItemManagerHandle<Application>>(null);

    // Stable helpers that talk to the table through the handle
    const patch = useCallback<Patch>((id, p) => manager.current?.patchItem(id, p), []);
    const replace = useCallback(
        (updated: Application) => manager.current?.updateItem(updated),
        []
    );

    const assigner = useReviewerAssigner(patch);
    const anonymizer = useAnonymize(patch);

    const extraRowActions = useMemo<RowActionButton<Application>[]>(
        () => [
            {
                icon: 'pi pi-user-plus',
                severity: 'info',
                tooltip: 'Manage Reviewer Assigner',
                visible: () => hasPermission('application:reviewerAssigner:update'),
                disabled: (row) => row.status !== ApplicationStatus.shortlisted,
                onClick: assigner.open,
            },
            {
                icon: 'pi pi-eye-slash',
                severity: 'warning',
                tooltip: 'Anonymize Document',
                visible: () => hasPermission('application:anonymize'),
                disabled: (row) =>
                    row.anonymizationStatus === AnonymizationStatus.processing,
                onClick: anonymizer.open,
            },
        ],
        [hasPermission, assigner.open, anonymizer.open]
    );

    const tableProps = useMemo(
        () => ({
            enableSearch: true,
            expandable: {
                template: (application: Application) => (
                    <ApplicationDetail
                        application={application}
                        updateApplication={replace}
                    />
                ),
            },
        }),
        [replace]
    );

    return (
        <>
            <ItemManager<Application, { stage: Stage }>
                managerRef={manager}
                api={ApplicationApi}
                resource="application"
                itemName="Application"
                filter={{ stage }}
                enabled={!!stage}
                columns={COLUMNS}
                enableColumnToggle
                defaultHiddenFields={DEFAULT_HIDDEN}
                hideCreateAction
                hideEditAction
                hideDeleteAction
                statusField="status"
                transitions={APPLICATION_TRANSITIONS}
                // The transition response isn't populated: keep the row, take only the status
                mapTransitioned={(updated, previous) =>
                    previous ? { ...previous, status: updated.status } : updated
                }
                extraRowActions={extraRowActions}
                tableProps={tableProps}
                onError={(error, operation) =>
                    toast.error(error, operation)
                }
            />

            <ReviewerAssignerDialog {...assigner.dialogProps} />
            <ApplicationAnonymizeDialog {...anonymizer.dialogProps} />
        </>
    );
};

export default ApplicationManager;