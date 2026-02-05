import mongoose from "mongoose";
import { GetCompositionDTO, CreateCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { IComposition, Composition } from "./composition.model";


export interface ICompositionRepository {
    find(filters: GetCompositionDTO): Promise<IComposition[]>;
    findById(id: string): Promise<IComposition | null>;
    create(dto: CreateCompositionDTO): Promise<IComposition>;
    update(dto: UpdateCompositionDTO): Promise<IComposition | null>;
    delete(id: string): Promise<IComposition | null>;
}

export class CompositionRepository implements ICompositionRepository {

    async find(filters: GetCompositionDTO): Promise<IComposition[]> {
        const query: any = {};
        if (filters.constraint) query.constraint = filters.constraint;
        return Composition.find(query).exec();
    }

    async findById(id: string): Promise<IComposition | null> {
        return Composition.findById(id).exec();
    }

    async create(dto: CreateCompositionDTO): Promise<IComposition> {
        const data: Partial<IComposition> = {
            ...dto,
            constraint: new mongoose.Types.ObjectId(dto.constraint)
        };
        return Composition.create(data);
    }

    async update(dto: UpdateCompositionDTO): Promise<IComposition | null> {
        const { id, data } = dto;
        return Composition.findByIdAndUpdate(
            id,
            data,
            { new: true } 
        ).exec();
    }

    async delete(id: string): Promise<IComposition | null> {
        return Composition.findByIdAndDelete(id).exec();
    }
}
