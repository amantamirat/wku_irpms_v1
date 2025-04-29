import mongoose, { Schema, model, Document } from 'mongoose';


export interface IDirectorate extends Document {
    name: string; 
}

const DirectorateSchema = new Schema<IDirectorate>({
    name: {
        type: String,
        required: true
    }
});

const Directorate = model<IDirectorate>('Directorate', DirectorateSchema);
export default Directorate;
