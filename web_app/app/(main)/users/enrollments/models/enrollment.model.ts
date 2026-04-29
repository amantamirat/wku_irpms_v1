import { Calendar } from "@/app/(main)/calendars/models/calendar.model";
import { User } from "../../models/user.model";
import { Organization } from "@/app/(main)/organizations/models/organization.model";

export type Enrollment = {
    _id?: string;
    calendar?: string | Calendar;
    program?: string | Organization;
    student?: string | User;
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateEnrollment = (enrol: Enrollment): { valid: boolean; message?: string } => {
    if (!enrol.calendar) {
        return { valid: false, message: 'Calendar is required.' };
    }

    if (!enrol.program) {
        return { valid: false, message: 'Program is required.' };
    }

    if (!enrol.student) {
        return { valid: false, message: 'Student is required.' };
    }

    return { valid: true };
};

export const sanitizeStudent = (enrollment: Partial<Enrollment>): Partial<Enrollment> => {
    return {
        ...enrollment,
        calendar:
            typeof enrollment.calendar === 'object' && enrollment.calendar !== null
                ? (enrollment.calendar as any)._id
                : enrollment.calendar,
        program:
            typeof enrollment.program === 'object' && enrollment.program !== null
                ? (enrollment.program as any)._id
                : enrollment.program,
        student:
            typeof enrollment.student === 'object' && enrollment.student !== null
                ? (enrollment.student as any)._id
                : enrollment.student,
    };
};


export interface GetEnrollmentsOptions {
    student?: string | User;
}