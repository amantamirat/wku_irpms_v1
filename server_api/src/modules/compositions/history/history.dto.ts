import { IRange } from "../../../common/types/range";

export interface CreateHistoryDTO {
    name: string;
    description: string;
    submitted?: IRange;
    rejected?: IRange;
    completed?: IRange;
    granted?: IRange;
    userId?: string;
}

export interface UpdateHistoryDTO {
    id: string;
    data: Partial<CreateHistoryDTO>;
    userId?: string;
}

export interface GetHistoryRuleDTO {
    populate?: boolean;
}