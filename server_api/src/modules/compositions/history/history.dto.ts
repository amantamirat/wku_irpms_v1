import { IRange } from "../../../common/types/range";

export interface CreateHistoryDTO {
    name: string;
    description?: string;

    project?: {
        granted?: IRange;
        refused?: IRange;
        completed?: IRange;
    };

    application?: {
        submitted?: IRange;
        accepted?: IRange;
        rejected?: IRange;
    };
}

export interface UpdateHistoryDTO {
    id: string;
    data: Partial<CreateHistoryDTO>;
}


