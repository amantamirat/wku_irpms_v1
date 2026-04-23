import mongoose from "mongoose";
import { BasePosition, Position, Rank, BasePositionDocument } from "./position.model";
import {
    CreatePositionDTO,
    ExistsPositionDTO,
    GetPositionsDTO,
    UpdatePositionDTO
} from "./position.dto";
import { PositionType } from "./position.model";

export interface IPositionRepository {
    findById(id: string): Promise<BasePositionDocument | null>;
    find(filters: GetPositionsDTO): Promise<BasePositionDocument[]>;
    create(dto: CreatePositionDTO): Promise<BasePositionDocument>;
    update(id: string, dtoData: UpdatePositionDTO["data"]): Promise<BasePositionDocument | null>
    exists(filters: ExistsPositionDTO): Promise<boolean>;
    delete(id: string): Promise<BasePositionDocument | null>;
}

export class PositionRepository implements IPositionRepository {

    async findById(id: string) {
        return BasePosition.findById(new mongoose.Types.ObjectId(id))
            .lean<BasePositionDocument>()
            .exec();
    }

    async find(filters: GetPositionsDTO) {
        const query: any = {};

        // filter by type
        if (filters.type) {
            query.type = filters.type;
        }

        // filter by parent
        if (filters.parent) {
            query.parent = new mongoose.Types.ObjectId(filters.parent);
        }

        let dbQuery = BasePosition.find(query);

        // populate parent only if requested
        if (filters.populate) {
            dbQuery = dbQuery.populate("parent");
        }

        return dbQuery.lean<BasePositionDocument[]>().exec();
    }


    async create(dto: CreatePositionDTO) {

        // If parent exists → it's a Rank
        if (dto.parent) {
            return Rank.create({
                name: dto.name,
                parent: new mongoose.Types.ObjectId(dto.parent),
                type: PositionType.rank
            });
        }

        // Otherwise → it's a Position
        return Position.create({
            name: dto.name,
            type: PositionType.position
        });
    }

    async update(
        id: string,
        dtoData: UpdatePositionDTO["data"]
    ): Promise<BasePositionDocument | null> {

        const updateData: any = {};

        if (dtoData.name !== undefined) {
            updateData.name = dtoData.name;
        }

        if (dtoData.parent !== undefined) {
            updateData.parent = new mongoose.Types.ObjectId(dtoData.parent);
        }

        return BasePosition.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true } // return the updated document
        ).exec();
    }

    async exists(filters: ExistsPositionDTO): Promise<boolean> {
        const query: any = {};
        if (filters.parent) {
            query.parent = new mongoose.Types.ObjectId(filters.parent);
        }
        const result = await BasePosition.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return BasePosition.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}
