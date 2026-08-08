import { Schema, Document, model } from "mongoose";
import { COLLECTIONS } from "../../../common/constants/collections.enum";
import { Accessibility, Gender } from "../../users/user.model";
import { AcademicLevel } from "../../../common/constants/enums";
import { IRange, RangeSchema } from "../composition.model";


export interface IEligibilityProfile extends Document {
    name: string;
    description?: string;
    gender?: Gender;
    age?: IRange;
    experienceYears?: IRange;
    accessibility?: Accessibility[];
    academicLevels?: AcademicLevel[];
    createdAt?: Date;
    updatedAt?: Date;
}



const EligibilityProfileSchema =
    new Schema<IEligibilityProfile>(
        {

            name: {
                type: String,
                required: true,
                trim: true,
                unique: true
            },


            description: {
                type: String,
            },


            gender: {
                type: String,
                enum: Object.values(Gender)
            },


            age: {
                type: RangeSchema
            },


            experienceYears: {
                type: RangeSchema
            },


            accessibility: {
                type: [String],
                enum: Object.values(Accessibility),
                default: []
            },


            academicLevels: {
                type: [String],
                enum: Object.values(AcademicLevel),
                default: []
            }


        },
        {
            timestamps: true
        });



export const EligibilityProfile =
    model<IEligibilityProfile>(
        COLLECTIONS.ELIGIBILITY_PROFILE,
        EligibilityProfileSchema
    );