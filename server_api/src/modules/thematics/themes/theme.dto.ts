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

export interface FilterThemeDTO {
    parent?: string;
    thematicArea?: string;
    title?:string;
    level?: number;
}

/*
export interface IThemeImportDTO {
    title: string;
    priority?: number;
    children?: IThemeImportDTO[]; // Recursive definition
}*/