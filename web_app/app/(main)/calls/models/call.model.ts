import { Calendar } from "../../calendars/models/calendar.model";
import { Evaluation } from "../../evals/models/eval.model";
import { Grant } from "../../grants/models/grant.model";
import { Organization } from "../../organizations/models/organization.model";
import { Theme } from "../../themes/models/theme.model";

export enum CallStatus {
    planned = 'planned',
    active = 'active',
    closed = 'closed'
}
export type Call = {
    _id?: string;
    directorate: string | Organization;
    calendar?: string | Calendar;
    title: string;
    deadline: Date;
    description?: string | null;
    poster?: string | null;
    grant: string | Grant;
    theme?: string | Theme;
    evaluation: string | Evaluation;
    status: CallStatus;
    createdAt?: Date;
    updatedAt?: Date;
}


export const validateCall = (call: Call): { valid: boolean; message?: string } => {
    if (!call.title || call.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    if (!call.directorate) {
        return { valid: false, message: 'Directorate is required.' };
    }

    if (!call.calendar) {
        return { valid: false, message: 'Calendar is required.' };
    }

    if (!call.grant) {
        return { valid: false, message: 'Grant is required.' };
    }

    if (!call.theme) {
        return { valid: false, message: 'Grant is required.' };
    }

    if (!call.evaluation) {
        return { valid: false, message: 'Grant is required.' };
    }

    const deadlineDate = new Date(call.deadline);
    if (!call.deadline || isNaN(deadlineDate.getTime())) {
        return { valid: false, message: 'Deadline must be a valid date.' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
        return { valid: false, message: 'Deadline must be today or later.' };
    }

    if (!call.status) {
        return { valid: false, message: 'Status is required.' };
    }
    return { valid: true };
};


export const sanitizeCall = (call: Partial<Call>): Partial<Call> => {
    return {
        ...call,
        directorate:
            typeof call.directorate === "object" && call.directorate !== null
                ? (call.directorate as Organization)._id
                : call.directorate,
        calendar:
            typeof call.calendar === "object" && call.calendar !== null
                ? (call.calendar as Calendar)._id
                : call.calendar,
        grant:
            typeof call.grant === "object" && call.grant !== null
                ? (call.grant as Grant)._id
                : call.grant,
        theme:
            typeof call.theme === "object" && call.theme !== null
                ? (call.theme as Theme)._id
                : call.theme,
        evaluation:
            typeof call.evaluation === "object" && call.evaluation !== null
                ? (call.evaluation as Evaluation)._id
                : call.evaluation,
    };
}