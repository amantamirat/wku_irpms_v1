'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';
import { ItemManager, ItemManagerProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { Thematic, FilterThematics } from '../models/thematic.model';
import { ThematicApi } from '../api/thematic.api';
import ThematicForm from './ThematicForm';
import ThematicDetail from './ThematicDetail';
import { THEMATIC_TRANSITIONS } from '../models/thematic.state-machine';
import MyBadge from '@/templates/MyBadge';
import { MENU_ICONS } from '@/utils/menu-icons';

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    { header: 'Title', field: 'title', sortable: true },
    {
        header: 'Level',
        field: 'level',
        sortable: true,
        style: { width: '150px' }
    },
    { header: 'Description', field: 'description' },
    {
        field: 'status',
        header: 'Status',
        sortable: true,
        body: (thematic: Thematic) => (
            <MyBadge
                type="status"
                value={thematic.status ?? 'Unknown'}
            />
        )
    }
];

export default function ThematicManager() {
    const toast = useToast();

    // Memoize table configuration to maintain a stable reference.
    const tableProps: ItemManagerProps<
        Thematic,
        FilterThematics
    >['tableProps'] = useMemo(
        () => ({
            expandable: {
                template: (thematic) => (
                    <ThematicDetail thematic={thematic} />
                )
            }
        }),
        []
    );

    return (
        <ItemManager<Thematic, FilterThematics>
            api={ThematicApi}
            resource="thematic"
            itemName="Thematic"
            headerTitle="Manage Thematics"
            itemIcon={MENU_ICONS.thematics}
            columns={columns}
            tableProps={tableProps}
            dialogWidth="600px"
            statusField="status"
            transitions={THEMATIC_TRANSITIONS}
            renderForm={(props) => <ThematicForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Thematic created successfully'
                        : 'Thematic updated successfully'
                )
            }
        />
    );
}