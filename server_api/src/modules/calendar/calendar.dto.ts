import { CalendarStatus } from "./calendar.model";


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

export interface GetCalendarDTO {
    status?: CalendarStatus;
}

