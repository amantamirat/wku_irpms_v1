import { Calendar } from "@/app/(main)/calendars/models/calendar.model";
import { User } from "../../models/user.model";
import { Organization } from "@/app/(main)/organizations/models/organization.model";

export type Student = {
    _id?: string;
    calendar?: string | Calendar;
    program?: string | Organization;
    applicant?: string | User;
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateStudent = (student: Student): { valid: boolean; message?: string } => {
    if (!student.calendar) {
        return { valid: false, message: 'Calendar is required.' };
    }

    if (!student.program) {
        return { valid: false, message: 'Program is required.' };
    }

    if (!student.applicant) {
        return { valid: false, message: 'Applicant is required.' };
    }

    return { valid: true };
};

export const sanitizeStudent = (student: Partial<Student>): Partial<Student> => {
    return {
        ...student,
        calendar:
            typeof student.calendar === 'object' && student.calendar !== null
                ? (student.calendar as any)._id
                : student.calendar,
        program:
            typeof student.program === 'object' && student.program !== null
                ? (student.program as any)._id
                : student.program,
        applicant:
            typeof student.applicant === 'object' && student.applicant !== null
                ? (student.applicant as any)._id
                : student.applicant,
    };
};


export interface GetStudentsOptions {
    applicant?: string | User;
}