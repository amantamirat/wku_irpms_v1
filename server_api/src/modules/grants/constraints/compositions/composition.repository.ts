import mongoose from "mongoose";
import { GetCompositionDTO, CreateCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { IComposition, Composition } from "./composition.model";

export interface ICompositionRepository {
    find(filters: GetCompositionDTO): Promise<IComposition[]>;
    findById(id: string): Promise<IComposition | null>;
    create(dto: CreateCompositionDTO): Promise<IComposition>;
    update(dto: UpdateCompositionDTO): Promise<IComposition | null>;
    exists(constraint: string): Promise<boolean>;
    delete(id: string): Promise<IComposition | null>;
}

export class CompositionRepository implements ICompositionRepository {

    async find(filters: GetCompositionDTO): Promise<IComposition[]> {
        const query: any = {};
        if (filters.constraint) query.constraint = filters.constraint;
        let dbQuery = Composition.find(query);
        if (filters.populate) {
            dbQuery = dbQuery.populate("item");
        }
        return dbQuery.exec();
    }

    async findById(id: string): Promise<IComposition | null> {
        return Composition.findById(id).exec();
    }

    async create(dto: CreateCompositionDTO) {
        const data: any = {
            constraint: new mongoose.Types.ObjectId(dto.constraint),
            max: dto.max,
            min: dto.min,
        };

        if (dto.range) {
            data.range = dto.range;
        }

        if (dto.enumValue) {
            data.enumValue = dto.enumValue;
        }

        if (dto.item) {
            data.item = new mongoose.Types.ObjectId(dto.item);
            data.itemModel = dto.itemModel;
        }

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

    async exists(constraint: string): Promise<boolean> {
        const query: any = {};
        query.constraint = constraint;
        const result = await Composition.exists(query).exec();
        return result !== null;
    }

    async delete(id: string): Promise<IComposition | null> {
        return Composition.findByIdAndDelete(id).exec();
    }
}
