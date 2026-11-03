import { IRange } from "../../../common/types/range";
import { ProjectStatus } from "../../projects/project.model";
import {
    HistoryContext,
    HistoryParticipation,
} from "./history.model";

export interface CreateHistoryDTO {
    name: string;
    description?: string;
    context: HistoryContext;
    participation: HistoryParticipation;
    metrics?: ProjectStatus[];
    sumRange?: IRange;
}

export interface UpdateHistoryDTO {
    id: string;
    data: Partial<CreateHistoryDTO>;
}