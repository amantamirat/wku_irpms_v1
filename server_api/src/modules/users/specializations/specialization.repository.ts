import mongoose from "mongoose";
import { CreateSpecializationDTO, UpdateSpecializationDTO, GetSpecializationsOptions } from "./specialization.dto";
import { Specialization, ISpecialization } from "./specialization.model";

export interface ISpecializationRepository {
    findById(id: string): Promise<ISpecialization | null>;
    find(filters: GetSpecializationsOptions): Promise<Partial<ISpecialization>[]>;
    create(dto: CreateSpecializationDTO): Promise<ISpecialization>;
    update(id: string, data: UpdateSpecializationDTO["data"]): Promise<ISpecialization | null>;
    delete(id: string): Promise<ISpecialization | null>;
}

// MongoDB implementation
export class SpecializationRepository implements ISpecializationRepository {

    async findById(id: string) {
        return Specialization.findById(new mongoose.Types.ObjectId(id))
            .lean<ISpecialization>()
            .exec();
    }

    async find(filters: GetSpecializationsOptions) {
        const query: any = {};

        if (filters.academicLevel) {
            query.academicLevel = filters.academicLevel;
        }

        /*

        if (filters.name) {
            query.name = { $regex: filters.name, $options: "i" }; // case-insensitive search
        }
        */

        return Specialization.find(query).lean<ISpecialization[]>().exec();
    }

    async create(dto: CreateSpecializationDTO) {
        return Specialization.create({
            name: dto.name,
            academicLevel: dto.academicLevel,
        });
    }

    async update(id: string, dtoData: UpdateSpecializationDTO["data"]): Promise<ISpecialization | null> {
        const updateData: Partial<ISpecialization> = {};

        if (dtoData.name) updateData.name = dtoData.name;
        if (dtoData.academicLevel) updateData.academicLevel = dtoData.academicLevel;

        return Specialization.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }



    async delete(id: string) {
        return Specialization.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
