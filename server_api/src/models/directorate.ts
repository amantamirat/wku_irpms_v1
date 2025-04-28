import mongoose, { Schema, model, Document } from 'mongoose';

// Define the Directorate interface
export interface IDirectorate extends Document {
    name: string; // Name of the directorate
}

// Define the Directorate schema
const DirectorateSchema = new Schema<IDirectorate>({
    name: {
        type: String,
        required: true
    }
});

// Create and export the Directorate model
const Directorate = model<IDirectorate>('Directorate', DirectorateSchema);

export default Directorate;
