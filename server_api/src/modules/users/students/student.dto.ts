export interface CreateStudentDTO {
    calendar: string;
    program: string;
    applicant: string;
}

export interface UpdateStudentDTO {
    id: string;
    data: {
        calendar?: string;
        program?: string;
        applicant?: string;
    };
}

export interface GetStudentsOptions {
    applicant?: string;
}

export interface ExistsStudentDTO {
    calendar?:string;
    applicant?: string;
    program?: string;
}