import { Document, model, Schema } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { RangeSchema } from "../../../common/schemas/range.schema";
import { IRange } from "../../../common/types/range";
import { ProjectStatus } from "../../projects/project.model";

export enum HistoryContext {
    CALL = "CALL",
    ORGANIZATION = "ORGANIZATION",
    CALENDAR = "CALENDAR",
    SOURCE = "SOURCE",
    //STAGE = "STAGE",
}


export enum HistoryParticipation {
    LEAD = "LEAD",
    //COI = "CO-I",
    MEMBER = "MEMBER",
    ANY = "ANY"
}

export interface IHistoryRule extends Document {
    name: string;
    description?: string;
    context: HistoryContext;
    participation?: HistoryParticipation;
    metrics: ProjectStatus[];
    sumRange: IRange;  
    createdAt?: Date;
    updatedAt?: Date;
}




const HistoryRuleSchema = new Schema<IHistoryRule>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        description: {
            type: String,
            trim: true
        },

        context: {
            type: String,
            enum: Object.values(HistoryContext),
            required: true
        },

        participation: {
            type: String,
            enum: Object.values(HistoryParticipation),
            required: true,
            default: HistoryParticipation.ANY
        },

        metrics: {
            type: [String],
            enum: Object.values(ProjectStatus),
            required: true,
            default: []
        },

        sumRange: {
            type: RangeSchema,
            required: true
        },
    },
    {
        timestamps: true
    }
);

export const HistoryRule = model<IHistoryRule>(
    COLLECTIONS.HISTORY_RULE,
    HistoryRuleSchema
);