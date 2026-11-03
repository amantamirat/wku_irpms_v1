
'use client';

import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import MyBadge from '@/templates/MyBadge';
import { etbCurrencyFormatter } from '@/utils/utils';

import { Organization } from '../../organizations/models/organization.model';
import { Thematic } from '../../thematics/models/thematic.model';

import { GrantApi } from '../api/grant.api';
import {
    Grant
} from '../models/grant.model';
import { GRANT_TRANSITIONS } from '../models/grant.state-machine';

import GrantForm from './GrantForm';
import { MENU_ICONS } from '@/utils/menu-icons';

interface GrantManagerProps {
    organization?: Organization;
    thematic?: Thematic;
}

const DEFAULT_HIDDEN = [
    'constraint',
    'composition',
];

const columns: ColumnProps[] = [
    {
        header: 'Organization',
        field: 'organization.name',
        sortable: true,
        body: (grant: Grant) =>
            typeof grant.organization === 'object'
                ? grant.organization?.name
                : grant.organization
    },
    {
        header: 'Title',
        field: 'title',
        sortable: true
    },
    {
        header: 'Thematic',
        field: 'thematic.title',
        sortable: true,
        body: (grant: Grant) =>
            typeof grant.thematic === 'object'
                ? grant.thematic?.title
                : grant.thematic
    },
    {
        header: 'Constraint Profile',
        field: 'constraint',
        body: (grant: Grant) =>
            typeof grant.constraint === 'object' && grant.constraint !== null
                ? grant.constraint.name
                : grant.constraint ?? '-',
    },
    {
        header: 'Composition Template',
        field: 'composition',
        body: (grant: Grant) =>
            typeof grant.composition === 'object' && grant.composition !== null
                ? grant.composition.name
                : grant.composition ?? '-',
    },
    {
        header: 'Amount',
        field: 'amount',
        sortable: true,
        body: (grant: Grant) =>
            etbCurrencyFormatter.format(grant.amount ?? 0)
    },
    {
        header: 'Used',
        field: 'usedBudget',
        sortable: true,
        body: (grant: Grant) =>
            etbCurrencyFormatter.format(grant.usedBudget ?? 0)
    },

    {
        field: 'status',
        header: 'Status',
        sortable: true,
        body: (grant: Grant) => (
            <MyBadge
                type="status"
                value={grant.status ?? 'Unknown'}
            />
        )
    }
];

// Keep the permission ids the user picked: the API response may not echo them back
const mapSaved = (saved: Grant, submitted: Partial<Grant>): Grant => ({
    ...saved,
    organization: submitted.organization ?? saved.organization,
    thematic: submitted.thematic ?? saved.thematic,
    composition: submitted.composition ?? saved.composition,
    constraint: submitted.constraint ?? saved.constraint,
});

const GrantManager = ({
    organization,
    thematic
}: GrantManagerProps) => {
    const toast = useToast();

    return (
        <ItemManager<Grant>
            api={GrantApi}
            resource="grant"
            itemName="Grant"
            headerTitle="Manage Grants"
            itemIcon={MENU_ICONS.grants}
            mapSaved={mapSaved}
            columns={columns}
            enableColumnToggle
            defaultHiddenFields={DEFAULT_HIDDEN}
            dialogWidth="800px"
            statusField="status"
            transitions={GRANT_TRANSITIONS}
            renderForm={(props) => <GrantForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Grant created successfully'
                        : 'Grant updated successfully'
                )
            }
        />
    );
};

export default GrantManager;
