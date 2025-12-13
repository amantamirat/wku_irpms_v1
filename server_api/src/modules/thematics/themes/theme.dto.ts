export interface CreateThemeDTO {
    thematicArea: string;
    parent?: string;
    title: string;
    priority?: number;
    level: number;
}

export interface UpdateThemeDTO {
    id: string;
    data: Partial<{
        title: string;
        priority: number;
    }>;
    userId: string;
}

export interface GetThemeDTO {
    parent?: string;
    thematicArea?: string;
}