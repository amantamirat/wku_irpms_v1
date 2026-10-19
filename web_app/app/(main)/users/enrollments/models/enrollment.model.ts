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

export interface FilterEnrollments {
    student?: string | User;
}