import { Organization } from "../organization";

export enum ThemeType {
    theme = 'theme',
    subArea = 'sub-area',
    priorityArea = 'priority-area'
}

export type Theme = {
    _id?: string;
    type: ThemeType;
    directorate?: string | Organization;
    parent?: string | Theme;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateTheme = (theme: Theme): { valid: boolean; message?: string } => {
    if (!theme.type) {
        return { valid: false, message: 'Theme type is required.' };
    }

    if (!theme.title || theme.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }

    if (theme.type === ThemeType.theme) {
        if (!theme.directorate) {
            return { valid: false, message: 'Directorate is required.' };
        }
    } else {
        if (!theme.parent) {
            return { valid: false, message: 'Theme parent is required.' };
        }
    }
    return { valid: true };
};