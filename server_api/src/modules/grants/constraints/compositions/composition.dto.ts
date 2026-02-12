export interface CreateCompositionDTO {
    constraint: string;
    max: number;
    min: number;
    range?: {
        min: number;
        max: number;
    };
    item?: string;
}

export interface GetCompositionDTO {
    constraint: string;
}

export interface UpdateCompositionDTO {
    id: string,
    data: Partial<{    
        min: number;
        max: number;
        /**
         *  range: {
            min?: number;
            max?: number;
        };
         */
        //item: string;
    }>;
}