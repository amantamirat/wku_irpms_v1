import { IRange } from "../../../common/types/range";
import { HistoryParticipation } from "./history.model";

export interface CreateHistoryDTO {
    name: string;
    
    description?: string;
    
    participation?: HistoryParticipation;
    
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


