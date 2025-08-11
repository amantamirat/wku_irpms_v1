import { Organization } from "../organization";

export enum ThemeType {
    catalog = 'Catalog',
    theme = 'Theme',
    subTheme = 'Sub Theme',
    focusArea = 'Focus Area'
}

export type Theme = {
    _id?: string;
    type: ThemeType;
    directorate?: string | Organization;
    parent?: string | Theme;
    priority?: number;
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

    if (theme.type === ThemeType.catalog) {
        if (!theme.directorate) {
            return { valid: false, message: 'Directorate is required.' };
        }
        if (!theme.priority) {
            return { valid: false, message: 'Depth is required.' };
        }
        if (theme.priority > 3 || theme.priority <= 0) { 
             return { valid: false, message: 'Invlaid Depth Input.' };
        }
    } else {
        if (!theme.parent) {
            return { valid: false, message: 'Theme parent is required.' };
        }
    }
    return { valid: true };
};