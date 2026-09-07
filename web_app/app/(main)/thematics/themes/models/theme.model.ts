import { Thematic } from "../../models/thematic.model";

export type Theme = {
    _id?: string;
    title: string;
    thematicArea?: string | Thematic;
    parent?: string | Theme;
    priority?: number;
    level?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface FilterThemesOptions {
    parent?: string | Theme;
    thematicArea?: string | Thematic;
    level?: number;
}


export const validateTheme = (theme: Theme): { valid: boolean; message?: string } => {
    if (!theme.title || theme.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    if (!theme.priority) {
        return { valid: false, message: 'Priority is required.' };
    }
    return { valid: true };
};


