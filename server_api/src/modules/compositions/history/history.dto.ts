import { IRangeDTO } from "../composition.dto";


export interface CreateHistoryDTO {
    name: string;
    description: string;
    submitted?: IRangeDTO;
    rejected?: IRangeDTO;
    completed?: IRangeDTO;
    granted?: IRangeDTO;
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