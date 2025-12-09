import { Organization } from "../../organizations/models/organization.model";


export enum ThemeLevel {
    broad = 'Broad',
    componenet = 'Componenet',
    narrow = 'Narrow'
}



export type Thematic = {
    _id?: string;
    directorate?: string | Organization;
    title: string;
    level?: ThemeLevel;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GetThematicsOptions {
    directorate?: string | Organization;
}
export const validateThematic = (thmc: Thematic): { valid: boolean; message?: string } => {
    if (!thmc.title || thmc.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    if (!thmc.level) {
        return { valid: false, message: 'Level is required.' };
    }
    if (!thmc.directorate) {
        return { valid: false, message: 'Directorate is required.' };
    }
    return { valid: true };
};


export function sanitizeThematic(thmc: Partial<Thematic>): Partial<Thematic> {
    return {
        ...thmc,
        directorate:
            typeof thmc.directorate === 'object' && thmc.directorate !== null
                ? (thmc.directorate as Organization)._id
                : thmc.directorate
    };
}