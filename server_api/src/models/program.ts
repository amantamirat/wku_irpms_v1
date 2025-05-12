import mongoose, { Schema, model, Document } from 'mongoose';

export enum AcademicLevel {
    Certificate = 'Certificate',
    Diploma = 'Diploma',
    BA = 'BA',
    BSc = 'BSc',
    BT = 'BT',
    MA = 'MA',
    MSc = 'MSc',
    MPhil = 'MPhil',
    MT = 'MT',
    PhD = 'PhD',
    PostDoc = 'PostDoc'
}

export enum Classification {
    Regular = 'Regular',
    Evening = 'Evening',
    Weekend = 'Weekend'
}

export interface IProgram extends Document {
    department: mongoose.Types.ObjectId;
    program_name: string;
    academic_level: AcademicLevel;
    classification: Classification;
}

const ProgramSchema = new Schema<IProgram>({
    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    program_name: {
        type: String,
        required: true,
        trim: true,
    },
    academic_level: {
        type: String,
        enum: Object.values(AcademicLevel),
        required: true
    },
    classification: {
        type: String,
        enum: Object.values(Classification),
        required: true
    }
}, { timestamps: true });

ProgramSchema.index({ department: 1, program_name: 1, classification:1 }, { unique: true });
const Program = model<IProgram>('Program', ProgramSchema);
export default Program;
