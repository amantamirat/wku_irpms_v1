export interface CreateStudentDTO {
    calendar: string;
    program: string;
    user: string;
}

export interface UpdateStudentDTO {
    id: string;
    data: {
        calendar?: string;
        program?: string;
        user?: string;
    };
}

export interface GetStudentsOptions {
    user?: string;
}

export interface ExistsStudentDTO {
    calendar?:string;
    user?: string;
    program?: string;
}