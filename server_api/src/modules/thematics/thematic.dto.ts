import { ThemeLevel } from "../themes/theme.enum";

export interface CreateThematicDTO {
    directorate: string;
    title: string;
    level: ThemeLevel;
    description?: string;
}

export interface UpdateThematicDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
    }>;
    userId:string;
}

export interface GetThematicsDTO {
    directorate?: string;
}
