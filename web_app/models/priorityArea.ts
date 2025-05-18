import { Theme } from "./theme";

export type PriorityArea = {
    _id?: string;
    theme: string | Theme;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validatePriorityArea = (priorityArea: PriorityArea): { valid: boolean; message?: string } => {

    if (!priorityArea.theme) {
        return { valid: false, message: 'Theme is required.' };
    }

    if (!priorityArea.title || priorityArea.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    return { valid: true };
};