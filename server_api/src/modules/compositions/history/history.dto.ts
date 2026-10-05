import { IRange } from "../../../common/types/range";
import {
    HistoryParticipation,
    IHistoryRuleTotal
} from "./history.model";

export interface CreateHistoryDTO {
    name: string;

    description?: string;

    participation?: HistoryParticipation;

    project?: {
        granted?: IRange;
        refused?: IRange;
        completed?: IRange;
        verified?: IRange;
    };

    application?: {
        submitted?: IRange;
        accepted?: IRange;
        rejected?: IRange;
    };

    verification?: {
        submitted?: IRange;
        verified?: IRange;
        rejected?: IRange;
    };

    total?: IHistoryRuleTotal;
}

export interface UpdateHistoryDTO {
    id: string;
    data: Partial<CreateHistoryDTO>;
}