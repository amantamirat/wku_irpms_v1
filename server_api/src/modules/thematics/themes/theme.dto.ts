export interface CreateThemeDTO {
    title: string;
    priority?: number;
    parent?: string;
    thematicArea: string;
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