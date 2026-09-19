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

export interface IHistoryRule extends Document {
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