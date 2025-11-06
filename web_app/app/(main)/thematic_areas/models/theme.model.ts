import { Organization } from "../../organizations/models/organization.model";


export enum ThemeLevel {
    broad = 'Broad',
    componenet = 'Componenet',
    narrow = 'Narrow'
}

export enum ThemeType {
    thematic_area = 'Thematic Area',
    broadTheme = 'Theme',
    componenet = 'Componenet',
    focusArea = 'Focus Area'
}

export type Theme = {
    _id?: string;
    type: ThemeType;
    title: string;
    directorate?: string | Organization;
    level?: ThemeLevel;
    parent?: string | Theme;
    priority?: number | ThemeLevel;
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

    if (theme.type === ThemeType.thematic_area) {
        if (!theme.directorate) {
            return { valid: false, message: 'Directorate is required.' };
        }
        if (!theme.level) {
            return { valid: false, message: 'Level is required.' };
        }
    } else {
        if (!theme.parent) {
            return { valid: false, message: 'Theme parent is required.' };
        }
    }
    return { valid: true };
};