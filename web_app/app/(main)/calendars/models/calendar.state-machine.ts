export enum CalendarStatus {
    planned = 'planned',
    active = 'active',
    closed = 'closed'
}

export const CALENDAR_STATUS_ORDER: CalendarStatus[] = [
    CalendarStatus.planned,
    CalendarStatus.active,
    CalendarStatus.closed
];

export const CALENDAR_TRANSITIONS: Record<CalendarStatus, CalendarStatus[]> = {
    [CalendarStatus.planned]: [CalendarStatus.active],
    [CalendarStatus.active]: [CalendarStatus.closed, CalendarStatus.planned],
    [CalendarStatus.closed]: [CalendarStatus.active]
};