export enum Status {
    active = 'active',
    closed = 'closed'
}

export type Calendar = {
    _id?: string;
    year: number;
    start_date: Date | null;
    end_date: Date | null;
    status: Status;
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateCalendar = (
    calendar: Calendar
): { valid: boolean; message?: string } => {
    if (!calendar.year || isNaN(calendar.year)) {
        return { valid: false, message: "Year is required and must be a valid number." };
    }

    if (!calendar.start_date || isNaN(new Date(calendar.start_date).getTime())) {
        return { valid: false, message: "Start date is not a valid date." };
    }

    if (!calendar.end_date || isNaN(new Date(calendar.end_date).getTime())) {
        return { valid: false, message: "End date is not a valid date." };
    }

    if (new Date(calendar.start_date) >= new Date(calendar.end_date)) {
        return { valid: false, message: "Start date must be before end date." };
    }

    return { valid: true };
};
