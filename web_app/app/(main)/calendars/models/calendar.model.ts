export enum CalendarStatus {
    planned = 'planned',
    active = 'active',
    closed = 'closed'
}

export type Calendar = {
    _id?: string;
    year: number;
    startDate: Date | null;
    endDate: Date | null;
    status?: CalendarStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateCalendar = (
    calendar: Calendar
): { valid: boolean; message?: string } => {
    if (
        !calendar.year ||
        isNaN(calendar.year) ||
        calendar.year < 1970 ||
        calendar.year > 9999
    ) {
        return {
            valid: false,
            message: "Year is required and must be a four-digit number (1970-8888)."
        };
    }

    if (!calendar.startDate || isNaN(new Date(calendar.startDate).getTime())) {
        return { valid: false, message: "Start date is not a valid date." };
    }

    if (!calendar.endDate || isNaN(new Date(calendar.endDate).getTime())) {
        return { valid: false, message: "End date is not a valid date." };
    }

    if (new Date(calendar.startDate) >= new Date(calendar.endDate)) {
        return { valid: false, message: "Start date must be before end date." };
    }

    return { valid: true };
};

export const createEmptyCalendar = (): Calendar => ({
    year: new Date().getFullYear(),
    startDate: null,
    endDate: null,
    status: CalendarStatus.planned
});

export interface GetCalendarOptions {
    status?: CalendarStatus;
}



