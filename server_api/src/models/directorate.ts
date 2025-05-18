import mongoose, { Schema, model, Document } from 'mongoose';
import { Theme } from './theme/theme.model';


export interface IDirectorate extends Document {
    directorate_name: string;
}

const DirectorateSchema = new Schema<IDirectorate>({
    directorate_name: {
        type: String,
        required: true
    }
});

DirectorateSchema.pre('findOneAndDelete', async function (next) {
    const directorate = await this.model.findOne(this.getQuery());
    if (!directorate) return next();
    const isReferenced = await Theme.exists({ directorate: directorate._id });
    if (isReferenced) {
        return next(new Error('Cannot delete directorate: it has themes.'));
    }
    next();
});

const Directorate = model<IDirectorate>('Directorate', DirectorateSchema);
export default Directorate;
