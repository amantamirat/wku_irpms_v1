'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';
import { BASE_URL } from '@/api/ApiClient';

import { VerificationApi } from '../api/verification.api';
import { FilterVerification, Verification } from '../models/verification.model';
import { VERIFICATION_TRANSITIONS } from '../models/verification.state-machine';
import { VerificationConfiguration } from '../verification-conf/models/verification-conf.model';
import VerificationDetail from './VerificationDetail';
import MyBadge from '@/templates/MyBadge';

interface VerificationManagerProps {
    configuration: VerificationConfiguration;
}

const DEFAULT_HIDDEN: string[] = [
    'createdBy.name',
];

const getVerificationColumns = (): ColumnProps[] => [
    {
        header: 'Project',
        field: 'project',
        sortable: true,
        body: (row: Verification) => {
            const projectTitle =
                typeof row.project === 'object' && row.project !== null
                    ? (row.project as any).title
                    : row.project;

            return (
                <div
                    className="text-700 truncate text-sm"
                    style={{ maxWidth: '250px' }}
                    title={String(projectTitle ?? '')}
                >
                    {projectTitle ?? '-'}
                </div>
            );
        },
    },
    {
        header: 'Attempt',
        field: 'attempt',
        sortable: true,
        body: (row: Verification) => (
            <span className="font-semibold text-700">
                #{row.attempt ?? '-'}
            </span>
        ),
    },
    {
        header: 'Score',
        field: 'totalScore',
        sortable: true,
        body: (row: Verification) => (
            <span className="font-bold text-sm">
                {typeof row.totalScore === 'number'
                    ? row.totalScore
                    : '—'}
            </span>
        ),
    },
    {
        header: 'Document',
        field: 'documentPath',
        body: (row: Verification) =>
            row.documentPath ? (
                <a
                    href={`${BASE_URL}/${row.documentPath.replace(/^\/+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium text-sm"
                >
                    <i className="pi pi-file-pdf text-red-500" />
                    View PDF
                </a>
            ) : (
                <span className="text-gray-400 italic">
                    No document
                </span>
            ),
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        body: (row: Verification) => (
            <MyBadge
                type="status"
                value={row.status ?? 'submitted'}
            />
        ),
    },
];

export default function VerificationManager({
    configuration,
}: VerificationManagerProps) {
    const toast = useToast();


    const tableProps = useMemo(
        () => ({
            enableSearch: true,
            expandable: {
                template: (verification: Verification) => (
                    <VerificationDetail verification={verification} />
                ),
            },
        }),
        []
    );

    const columns = useMemo(
        () => getVerificationColumns(),
        []
    );

    const filter = useMemo<FilterVerification>(
        () => ({
            configuration: configuration._id,
        }),
        [configuration._id]
    );

    return (
        <ItemManager<Verification, FilterVerification>
            api={VerificationApi}
            resource="verification"
            itemName="Verification"
            headerTitle="Manage Verifications"
            itemIcon={MENU_ICONS.verifications}
            columns={columns}
            enableColumnToggle
            defaultHiddenFields={DEFAULT_HIDDEN}
            filter={filter}
            hideCreateAction
            hideEditAction
            hideDeleteAction
            statusField="status"
            transitions={VERIFICATION_TRANSITIONS}
            tableProps={tableProps}
            onError={(error) => toast.error(error)}
        />
    );
}