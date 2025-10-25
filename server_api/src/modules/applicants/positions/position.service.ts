import mongoose from "mongoose";
import { BasePosition, Position, Rank } from "./position.model";
import { PositionType } from "./position.enum";
//import { Scope } from "../applicant.enum";


export interface CreatePositionDto {
    name: string;
    type: PositionType;
    category?: string; // only for Position
    parent?: mongoose.Types.ObjectId; // only for Rank
}

export interface GetPositionOptions {
    type?: PositionType;
    parent?: string;
}

export class PositionService {

    private static async validatePosition(data: CreatePositionDto) {
        if (data.type === PositionType.rank) {
            const position = await Position.findById(data.parent).lean();
            if (!position) throw new Error("Position not found");
        }
    }

    static async createPosition(data: CreatePositionDto) {
        await this.validatePosition(data);
        return await BasePosition.create(data);
    }

    static async getPositions(options: GetPositionOptions = {}) {
        const filter: any = {};
        if (options.parent) filter.parent = options.parent;
        if (options.type) filter.type = options.type;

        if (options.type === PositionType.position) {
            return await Position.find(filter).lean();
        }
        if (options.type === PositionType.rank) {
            return await Rank.find(filter)
                .populate("parent")
                .lean();
        }
        return await BasePosition.find(filter).lean();
    }


    static async updatePosition(id: string, data: Partial<CreatePositionDto>) {
        const doc = await BasePosition.findById(id);
        if (!doc) throw new Error("Position not found");
        await this.validatePosition(data as CreatePositionDto);
        Object.assign(doc, data);
        return await doc.save();
    }


    static async deletePosition(id: string) {
        const doc = await BasePosition.findById(id);
        if (!doc) throw new Error("Position not found");
        return await doc.deleteOne();
    }
}
