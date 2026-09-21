import mongoose, { Schema, Document, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { RangeSchema } from "../../../common/schemas/range.schema";
import { IRange } from "../../../common/types/range";

export enum HistoryContext {
    CALL = "CALL",
    ORGANIZATION = "ORGANIZATION",
    CALENDAR = "CALENDAR",
    SOURCE = "SOURCE"
}

export interface IHistoryRuleReference {
    context: HistoryContext;
    rule: mongoose.Types.ObjectId;
}

export enum HistoryParticipation {
    LEAD = "LEAD",
    MEMBER = "MEMBER",
    ANY = "ANY"
}

export interface IHistoryRule extends Document {
    name: string;
    description?: string;

    participation?: HistoryParticipation | null;

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

    verification?: {
        submitted?: IRange;
        verified?: IRange;
        rejected?: IRange;
    };

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

        participation: {
            type: String,
            enum: Object.values(HistoryParticipation),
            required: true,
            default: HistoryParticipation.ANY
        },

        project: {
            granted: {
                type: RangeSchema
            },

            refused: {
                type: RangeSchema
            },

            completed: {
                type: RangeSchema
            }
        },

        application: {
            submitted: {
                type: RangeSchema
            },

            accepted: {
                type: RangeSchema
            },

            rejected: {
                type: RangeSchema
            }
        },
        verification: {
            submitted: {
                type: RangeSchema
            },

            verified: {
                type: RangeSchema
            },

            rejected: {
                type: RangeSchema
            }
        }
    },
    {
        timestamps: true
    }
);

export const HistoryRule = model<IHistoryRule>(
    COLLECTIONS.HISTORY_RULE,
    HistoryRuleSchema
);