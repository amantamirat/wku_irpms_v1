import { COLLECTIONS } from "../../../../common/constants/collections.enum";

export interface CreateCompositionDTO {
    constraint: string;
    max: number;
    min: number;

    // For range constraints
    range?: {
        min: number;
        max: number;
    };

    // For enum constraints
    enumValue?: string;

    // For dynamic constraints
    item?: string; // ObjectId as string from frontend
    itemModel?: COLLECTIONS.ORGANIZATION | COLLECTIONS.SPECIALIZATION;
}


export interface GetCompositionDTO {
    constraint?: string;
    populate?: boolean;
}

export interface UpdateCompositionDTO {
    id: string,
    data: Partial<{
        min: number;
        max: number;
    }>;
}