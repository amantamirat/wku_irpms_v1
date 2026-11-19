// utils/deadline.ts
import { differenceInCalendarDays, isPast } from 'date-fns';

export type DeadlineState = 'none' | 'open' | 'urgent' | 'closed';

export function getDeadlineInfo(value?: Date | string | null, urgentDays = 5) {
    const date = value ? new Date(value) : null;
    if (!date || isNaN(date.getTime())) {
        return { date: null, state: 'none' as DeadlineState, daysLeft: null, label: 'No deadline specified' };
    }

    const daysLeft = differenceInCalendarDays(date, new Date());
    const state: DeadlineState = isPast(date) ? 'closed' : daysLeft <= urgentDays ? 'urgent' : 'open';

    const label =
        state === 'closed' ? 'Deadline passed'
        : daysLeft === 0 ? 'Deadline is today'
        : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} remaining`;

    return { date, state, daysLeft, label };
}