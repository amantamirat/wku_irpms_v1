
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
            columns={columns}
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
