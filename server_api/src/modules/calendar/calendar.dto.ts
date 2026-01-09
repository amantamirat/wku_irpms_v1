import { CalendarStatus } from "./calendar.status";

export interface CreateCalendarDTO {
    year: number;
    startDate: Date;
    endDate: Date;
    status?: CalendarStatus;
    //userId: string;
}

export interface UpdateCalendarDTO {
    id: string;
    data: Partial<{
        year: number;
        startDate: Date;
        endDate: Date;
        status: CalendarStatus;
    }>;
    //userId: string;
}

export interface UpdateCalendarStatusDTO {
    id: string;
    status: CalendarStatus;
}

export interface GetCalendarDTO {
    status?: CalendarStatus;
}

