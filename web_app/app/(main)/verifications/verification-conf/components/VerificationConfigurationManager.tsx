'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';
import MyBadge from '@/templates/MyBadge';

import { VerificationConfigurationApi } from '../api/verification-conf.api';
import { VerificationConfiguration } from '../models/verification-conf.model';
import VerificationConfigurationForm from './VerificationConfigurationForm';

const DEFAULT_HIDDEN = [
    'template',
    'maxAttempts',
];

const getVerificationConfigurationColumns = (): ColumnProps[] => [
    {
        header: 'Grant',
        field: 'grant',
        sortable: true,
        body: (config: VerificationConfiguration) =>
            typeof config.grant === 'object' && config.grant !== null
                ? config.grant.title
                : config.grant ?? '-',
    },
    {
        header: 'Evaluation',
        field: 'evaluation',
        body: (config: VerificationConfiguration) =>
            typeof config.evaluation === 'object' && config.evaluation !== null
                ? config.evaluation.title
                : config.evaluation ?? '-',
    },
    {
        header: 'Reviewer Limits',
        field: 'minReviewers',
        sortable: true,
        style: { width: '12rem' },
        body: (config: VerificationConfiguration) => {
            const min = config.minReviewers ?? '-';
            const max = config.maxReviewers ?? '-';
            return `${min} - ${max}`;
        },
    },
    {
        header: 'Min Score',
        field: 'minAcceptanceScore',
        sortable: true,
        style: { width: '8rem' },
        body: (config: VerificationConfiguration) =>
            config.minAcceptanceScore !== undefined
                ? config.minAcceptanceScore
                : '-',
    },
    {
        header: 'Max Attempts',
        field: 'maxAttempts',
        sortable: true,
        style: { width: '9rem' },
        body: (config: VerificationConfiguration) =>
            config.maxAttempts !== undefined ? config.maxAttempts : '-',
    },
    {
        header: 'Template',
        field: 'template',
        body: (config: VerificationConfiguration) =>
            typeof config.template === 'object' && config.template !== null
                ? config.template.name
                : config.template ?? '-',
    },
    {
        header: 'Deadline',
        field: 'deadline',
        sortable: true,
        style: { width: '12rem' },
        body: (config: VerificationConfiguration) =>
            config.deadline
                ? new Date(config.deadline).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                  })
                : '-',
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        style: { width: '150px' },
        body: (config: VerificationConfiguration) => (
            <MyBadge
                type="status"
                value={config.status ?? 'Unknown'}
            />
        ),
    },
];

export default function VerificationConfigurationManager() {
    const toast = useToast();

    const columns = useMemo(() => getVerificationConfigurationColumns(), []);

    return (
        <ItemManager<VerificationConfiguration>
            api={VerificationConfigurationApi}
            resource="verification-conf"
            itemName="Verification Configuration"
            headerTitle="Verification Configurations"
            itemIcon={'pi pi-cog'}
            columns={columns}
            enableColumnToggle
            defaultHiddenFields={DEFAULT_HIDDEN}
            dialogWidth="800px"
            statusField="status"
            renderForm={(props) => (
                <VerificationConfigurationForm {...props} />
            )}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Verification Configuration created successfully'
                        : 'Verification Configuration updated successfully',
                )
            }
        />
    );
}