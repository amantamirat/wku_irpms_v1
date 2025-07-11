import { Schema, model, Document } from 'mongoose';
//import { Organization } from './organization.model';

export interface ISector extends Document {
    sector_name: string;
}

const SectorSchema = new Schema<ISector>({
    sector_name: {
        type: String,
        required: true,
        trim: true,
        index: { unique: true }
    }
}, { timestamps: true });

SectorSchema.pre('findOneAndDelete', async function (next) {
    const sector = await this.model.findOne(this.getQuery());
    if (!sector) return next();
    //const isReferenced = await Organization.exists({ sector: sector._id });
    const isReferenced = false;
    if (isReferenced) {
        return next(new Error('Cannot delete sector: it has Institute.'));
    }
    next();
});

const Sector = model<ISector>('Sector', SectorSchema);

export default Sector;
