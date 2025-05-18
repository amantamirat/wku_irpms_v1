import { Directorate } from "./directorate";

export enum ThemeStatus {
    Active = 'Active',
    Locked = 'Locked'
}

export type Theme = {
    _id?: string;
    directorate: string | Directorate;
    title: string;
    status: ThemeStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateTheme = (theme: Theme): { valid: boolean; message?: string } => {

    if (!theme.title || theme.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }

    if (!theme.status) {
        return { valid: false, message: 'Status is required.' };
    }

    return { valid: true };
};