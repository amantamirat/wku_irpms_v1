import { Organization } from "../organization";

export enum ThemeLevel {
    broad = 'Broad',
    componenet = 'Componenet',
    narrow = 'Narrow',
    //deep = 'Deep'
}

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
    priority?: number | ThemeLevel;
    title: string;
    createdAt?: Date;
    updatedAt?: Date;
}

function isThemeLevel(value: unknown): value is ThemeLevel {
    return Object.values(ThemeLevel).includes(value as ThemeLevel);
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
            return { valid: false, message: 'Level is required.' };
        }
        /**
         * 
         * if (theme.priority > 3 || theme.priority <= 0) {
            return { valid: false, message: 'Invlaid Level Input.' };
        }
        */
        if (!isThemeLevel(theme.priority)) {
            return { valid: false, message: 'Invalid Level Input.' };
        }
    } else {
        if (!theme.parent) {
            return { valid: false, message: 'Theme parent is required.' };
        }
    }
    return { valid: true };
};