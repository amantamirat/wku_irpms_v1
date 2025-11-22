export interface CreateCompositionDTO {
    constraint: string;
    value: number;
    max?: number;
    min?: number;
    item?: string;
}

export interface GetCompositionDTO {
    constraint: string;
}

export interface UpdateCompositionDTO {
    id: string,
    data: Partial<{
        value: number;
        min: number;
        max: number;
        item: string;
    }>;
}