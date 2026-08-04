import { Schema, Document, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { IRange, RangeSchema } from "../composition.model";


export interface IHistoryRule extends Document {

    name: string;

    description?: string;


    submitted?: IRange;


    rejected?: IRange;


    completed?: IRange;


    granted?: IRange;


    createdAt?: Date;

    updatedAt?: Date;

}



const HistoryRuleSchema =
    new Schema<IHistoryRule>(
        {

            name: {
                type: String,
                required: true,
                trim: true,
                unique: true
            },


            description: {
                type: String,
                //required: true
            },


            submitted: {
                type: RangeSchema
            },


            rejected: {
                type: RangeSchema
            },


            completed: {
                type: RangeSchema
            },


            granted: {
                type: RangeSchema
            }

        },
        {
            timestamps: true
        });



export const HistoryRule =
    model<IHistoryRule>(
        COLLECTIONS.HISTORY_RULE,
        HistoryRuleSchema
    );