import mongoose from "mongoose";
import { Position, PositionDocument } from "./position.model";
import {
    CreatePositionDTO,
    ExistsPositionDTO,
    GetPositionsDTO,
    UpdatePositionDTO
} from "./position.dto";

export interface IPositionRepository {
    findById(id: string): Promise<PositionDocument | null>;
    find(filters: GetPositionsDTO): Promise<PositionDocument[]>;
    create(dto: CreatePositionDTO): Promise<PositionDocument>;
    update(id: string, dtoData: UpdatePositionDTO["data"]): Promise<PositionDocument | null>;
    exists(filters: ExistsPositionDTO): Promise<boolean>;
    delete(id: string): Promise<PositionDocument | null>;
}

export class PositionRepository implements IPositionRepository {

    async findById(id: string) {
        return Position.findById(new mongoose.Types.ObjectId(id))
            .lean<PositionDocument>()
            .exec();
    }

    async find(filters: GetPositionsDTO) {
        const query: any = {};

        // optional search by name
        if (filters.search) {
            query.name = { $regex: filters.search, $options: "i" };
        }

        return Position.find(query)
            .lean<PositionDocument[]>()
            .exec();
    }

    async create(dto: CreatePositionDTO) {
        return Position.create({
            name: dto.name
        });
    }

    async update(
        id: string,
        dtoData: UpdatePositionDTO["data"]
    ): Promise<PositionDocument | null> {

        const updateData: any = {};

        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
        }

        return Position.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistsPositionDTO): Promise<boolean> {
        const query: any = {};

        if (filters.name) {
            query.name = { $regex: `^${filters.name}$`, $options: "i" }; // case-insensitive exact match
        }

        const result = await Position.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return Position.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}