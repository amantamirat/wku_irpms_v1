'use client';

import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import MyBadge from '@/templates/MyBadge';
import { CalendarApi } from '../api/calendar.api';
import { Calendar, FilterCalendarOptions } from '../models/calendar.model';
import { CALENDAR_TRANSITIONS } from '../models/calendar.state-machine';
import CalendarForm from './CalendarForm';

// Defined outside the component for a stable reference
const columns: ColumnProps[] = [
    {
        header: 'Year',
        field: 'year',
        sortable: true,
    },
    {
        header: 'Start Date',
        field: 'startDate',
        body: (calendar: Calendar) =>
            calendar.startDate
                ? new Date(calendar.startDate).toLocaleDateString()
                : '-',
    },
    {
        header: 'End Date',
        field: 'endDate',
        body: (calendar: Calendar) =>
            calendar.endDate
                ? new Date(calendar.endDate).toLocaleDateString()
                : '-',
    },
    {
        field: 'status',
        header: 'Status',
        sortable: true,
        body: (calendar: Calendar) => (
            <MyBadge
                type="status"
                value={calendar.status ?? 'Unknown'}
            />
        ),
    },
];

export default function CalendarManager() {
    const toast = useToast();

    return (
        <ItemManager<Calendar, FilterCalendarOptions>
            api={CalendarApi}
            resource="calendar"
            itemName="Calendar"
            headerTitle="Manage Calendars"
            itemIcon={MENU_ICONS.calendars}
            columns={columns}
            dialogWidth="600px"
            statusField="status"
            transitions={CALENDAR_TRANSITIONS}
            renderForm={(props) => <CalendarForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Calendar created successfully'
                        : 'Calendar updated successfully'
                )
            }
        />
    );
}