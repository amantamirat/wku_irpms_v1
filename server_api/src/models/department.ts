import mongoose, { Schema, model, Document } from 'mongoose';
import Specialization from './specialization';

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
        trim: true,
        index: { unique: true }
    }
}, { timestamps: true });

DepartmentSchema.pre('findOneAndDelete', async function (next) {
    const department = await this.model.findOne(this.getQuery());
    if (!department) return next();
    const isReferenced = await Specialization.exists({ department: department._id });
    if (isReferenced) {
        return next(new Error('Cannot delete department: it has specializations.'));
    }
    next();
});

const Department = model<IDepartment>('Department', DepartmentSchema);
export default Department;
