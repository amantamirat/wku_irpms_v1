export enum CalendarStatus {
    planned = 'planned',
    active = 'active',
    closed = 'closed'
}

export const CALENDAR_TRANSITIONS: Record<CalendarStatus, CalendarStatus[]> = {
    [CalendarStatus.planned]: [CalendarStatus.active],
    [CalendarStatus.active]: [CalendarStatus.closed, CalendarStatus.planned],
    [CalendarStatus.closed]: [CalendarStatus.active]
};