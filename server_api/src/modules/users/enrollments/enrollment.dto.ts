export interface CreateEnrollmentDTO {
    calendar: string;
    program: string;
    student: string;
}

export interface UpdateEnrollmentDTO {
    id: string;
    data: {
        calendar?: string;
        program?: string;
        student?: string;
    };
}

export interface GetEnrollmentsOptions {
    student?: string;
}

export interface ExistsEnrollmentDTO {
    calendar?:string;
    student?: string;
    program?: string;
}