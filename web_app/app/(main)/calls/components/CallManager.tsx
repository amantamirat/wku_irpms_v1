'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';

import { ItemManager, ItemManagerProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';
import MyBadge from '@/templates/MyBadge';

import { Call, FilterCallsDTO } from '../models/call.model';
import { CallApi } from '../api/call.api';
import { CALL_TRANSITIONS } from '../models/call.state-machine';
import CallForm from './CallForm';
import CallDetail from './CallDetail';

interface CallManagerProps {
    grant?: string;
}

const DEFAULT_HIDDEN = [
    'constraint',
    'composition',
];

const getCallColumns = (): ColumnProps[] => [
    {
        header: 'Title',
        field: 'title',
        sortable: true,
    },
    {
        header: 'Operational Year',
        field: 'calendar',
        sortable: true,
        body: (call: Call) =>
            typeof call.calendar === 'object' && call.calendar !== null
                ? call.calendar.year
                : call.calendar ?? '-',
    },
    {
        header: 'Grant',
        field: 'grant',
        sortable: true,
        body: (call: Call) =>
            typeof call.grant === 'object' && call.grant !== null
                ? call.grant.title
                : call.grant ?? '-',
    },
    {
        header: 'Constraint Profile',
        field: 'constraint',
        body: (call: Call) =>
            typeof call.constraint === 'object' && call.constraint !== null
                ? call.constraint.name
                : call.constraint ?? '-',
    },
    {
        header: 'Composition Template',
        field: 'composition',
        body: (call: Call) =>
            typeof call.composition === 'object' && call.composition !== null
                ? call.composition.name
                : call.composition ?? '-',
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        style: { width: '150px' },
        body: (call: Call) => (
            <MyBadge
                type="status"
                value={call.status ?? 'Unknown'}
            />
        ),
    },
];

// Keep the relationship references the user picked if the API response doesn't echo them fully populated
const mapSaved = (saved: Call, submitted: Partial<Call>): Call => ({
    ...saved,
    calendar: submitted.calendar ?? saved.calendar,
    grant: submitted.grant ?? saved.grant,
    constraint: submitted.constraint ?? saved.constraint,
    composition: submitted.composition ?? saved.composition,
});

export default function CallManager({ grant }: CallManagerProps) {
    const toast = useToast();

    const columns = useMemo(() => getCallColumns(), []);

    const filter = useMemo<FilterCallsDTO | undefined>(
        () => (grant ? { grant } : undefined),
        [grant],
    );

    // Memoize tableProps configuration to maintain stable reference
    const tableProps: ItemManagerProps<Call, FilterCallsDTO>["tableProps"] = useMemo(() => ({
        expandable: {
            template: (call) => <CallDetail call={call} />
        }
    }), []);
    

    return (
        <ItemManager<Call, FilterCallsDTO>
            api={CallApi}
            resource="call"
            itemName="Call"
            headerTitle="Manage Calls"
            itemIcon={MENU_ICONS.calls}
            mapSaved={mapSaved}
            columns={columns}
            enableColumnToggle
            defaultHiddenFields={DEFAULT_HIDDEN}
            filter={filter}
            dialogWidth="800px"
            statusField="status"
            transitions={CALL_TRANSITIONS}
            tableProps={tableProps}
            renderForm={(props) => <CallForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Call created successfully'
                        : 'Call updated successfully',
                )
            }
        />
    );
}