import mongoose, { Schema, model, Document } from 'mongoose';



export interface ICall extends Document {
    directorate: mongoose.Types.ObjectId; 
    academic_year: number; // Assuming Year is just a number (e.g., 2025)
    title: string;
    description: string;
    notes: string[]; 
    dead_line: Date; 
    total_allocated_budget?: number;
    status: 'Planned' | 'Active' | 'Closed' | 'Locked'; 
}


const CallSchema = new Schema<ICall>({
    directorate: {
        type: Schema.Types.ObjectId,
        ref: 'Directorate', 
        required: true
    },
    academic_year: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    notes: {
        type: [String], 
        required: true
    },
    dead_line: {
        type: Date, 
        required: true
    },
    total_allocated_budget: {
        type: Number, // Float (nullable)
        required: false, // This is nullable, so it's not required
        default: null 
    },
    status: {
        type: String,
        enum: ['Planned', 'Active', 'Closed', 'Locked'], 
        required: true
    }
});


const Call = model<ICall>('Call', CallSchema);
export default Call;
