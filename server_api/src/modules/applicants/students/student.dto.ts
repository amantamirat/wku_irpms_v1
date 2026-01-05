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