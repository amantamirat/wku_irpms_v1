import { Organization } from "../../organizations/models/organization.model";
import { ThematicStatus } from "./thematic.state-machine";

/*
export enum ThemeType {
    theme = 'Theme',
    component = 'Component'
}
*/

export enum ThemeLevel {
    broad = 'Broad',
    divison = 'Division',
    narrow = 'Narrow',//focus-area
    deep = 'Deep',//priority-area
    //crossCutting="Cross Cutting"
}

export const themeLevelIndex: Record<ThemeLevel, number> = {
    [ThemeLevel.broad]: 0,
    [ThemeLevel.divison]: 1,
    [ThemeLevel.narrow]: 2,
    [ThemeLevel.deep]: 3,
};



export type Thematic = {
    _id?: string;
    // directorate?: string | Organization;
    title: string;
    //type?: ThemeType;
    level: ThemeLevel;
    description?: string;
    status?: ThematicStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GetThematicsOptions {
    //directorate?: string | Organization;
    populate?: boolean;
}
export const validateThematic = (thmc: Thematic): { valid: boolean; message?: string } => {
    if (!thmc.title || thmc.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }
    /*
    if (!thmc.type) {
        return { valid: false, message: 'Type is required.' };
    }
    */
    if (!thmc.level) {
        return { valid: false, message: 'Level is required.' };
    }
    /*
    if (!thmc.directorate) {
        return { valid: false, message: 'Directorate is required.' };
    }
    */
    return { valid: true };
};


export function sanitize(thmc: Partial<Thematic>): Partial<Thematic> {
    return {
        ...thmc,
        /*
        directorate:
            typeof thmc.directorate === 'object' && thmc.directorate !== null
                ? (thmc.directorate as Organization)._id
                : thmc.directorate*/
    };
}

export const createEmptyThematic = (): Thematic => ({
    //directorate: "",
    title: "",
    level: ThemeLevel.broad
})