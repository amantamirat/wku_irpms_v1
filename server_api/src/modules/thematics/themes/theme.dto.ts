export interface CreateThemeDTO {
    thematicArea: string;
    parent?: string;
    title: string;
    priority?: number;
    level?: number;
}

export interface UpdateThemeDTO {
    id: string;
    data: Partial<{
        title: string;
        priority: number;
    }>;
    userId?: string;
}

export interface GetThemeDTO {
    parent?: string;
    thematicArea?: string;
    level?: number;
    populate?: boolean;
}

export interface ExistsThemeDTO {
    parent?: string;
    thematicArea?: string;
}

export interface IThemeImportDTO {
    title: string;
    priority?: number;
    children?: IThemeImportDTO[]; // Recursive definition
}