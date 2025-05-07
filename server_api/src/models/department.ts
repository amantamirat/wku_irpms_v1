import mongoose, { Schema, model, Document } from 'mongoose';

export interface IDepartment extends Document {
    college: mongoose.Types.ObjectId;
    department_name: string;
}

const DepartmentSchema = new Schema<IDepartment>({
    college: {
        type: Schema.Types.ObjectId,
        ref: 'College',
        required: true
    },
    department_name: {
        type: String,
        required: true,
        index: { unique: true }
    }
}, { timestamps: true });

const Department = model<IDepartment>('Department', DepartmentSchema);

export default Department;
