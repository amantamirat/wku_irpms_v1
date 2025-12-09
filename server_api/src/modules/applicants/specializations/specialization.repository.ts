import mongoose from "mongoose";
import { Specialization, ISpecialization } from "./specialization.model";
import { CreateSpecializationDTO, UpdateSpecializationDTO } from "./specialization.dto";

export interface ISpecializationRepository {
    findById(id: string): Promise<ISpecialization | null>;
    findAll(): Promise<ISpecialization[]>;
    create(data: CreateSpecializationDTO): Promise<ISpecialization>;
    update(id: string, data: UpdateSpecializationDTO["data"]): Promise<ISpecialization>;
    delete(id: string): Promise<void>;
}

export class SpecializationRepository implements ISpecializationRepository {

    async findById(id: string) {
        return Specialization.findById(new mongoose.Types.ObjectId(id))
            .lean<ISpecialization>()
            .exec();
    }

    async findAll() {
        return Specialization.find()
            .lean<ISpecialization[]>()
            .exec();
    }

    async create(dto: CreateSpecializationDTO) {
        const data: Partial<ISpecialization> = {
            name: dto.name,
            academicLevel: dto.academicLevel
        };
        return Specialization.create(data);
    }

    async update(id: string, dtoData: UpdateSpecializationDTO["data"]) {
        const toUpdate: any = {};

        if (dtoData.name !== undefined) {
            toUpdate.name = dtoData.name;
        }
        if (dtoData.academicLevel) {
            toUpdate.academicLevel = dtoData.academicLevel;
        }

        const updated = await Specialization.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<ISpecialization>();

        if (!updated) {
            throw new Error("Specialization not found.");
        }

        return updated;
    }

    async delete(id: string) {
        const deleted = await Specialization.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
        if (!deleted) throw new Error("Specialization not found.");
    }
}
