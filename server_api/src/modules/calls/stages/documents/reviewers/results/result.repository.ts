//result.repository.ts
import mongoose from "mongoose";
import { Result, IResult } from "./result.model";
import { CreateResultDTO, UpdateResultDTO } from "./result.dto";

export interface IResultRepository {
    findById(id: string): Promise<IResult | null>;
    findByReviewer(reviewerId: string): Promise<Partial<any>[]>;
    //countByReviewer(reviewerId: string): Promise<number>;
    create(data: CreateResultDTO): Promise<IResult>;
    update(id: string, data: UpdateResultDTO["data"]): Promise<IResult>;
    delete(id: string): Promise<void>;
}

// MongoDB implementation
export class ResultRepository implements IResultRepository {

    async findById(id: string) {
        return Result.findById(new mongoose.Types.ObjectId(id)).lean<IResult>().exec();
    }

    async findByReviewer(reviewerId: string) {
        return Result.find({ reviewer: new mongoose.Types.ObjectId(reviewerId) })
            .populate("criterion selectedOption").lean<IResult[]>()
            .exec();
    }

    /*
    async countByReviewer(reviewerId: string) {
        return Result.countDocuments({ reviewer: new mongoose.Types.ObjectId(reviewerId) }).exec();
    }
        */

    async create(dto: CreateResultDTO) {
        const data: Partial<IResult> = {
            reviewer: new mongoose.Types.ObjectId(dto.reviewer),
            criterion: new mongoose.Types.ObjectId(dto.criterion),
            selectedOption: dto.selectedOption ? new mongoose.Types.ObjectId(dto.selectedOption) : undefined,
            score: dto.score,
            comment: dto.comment
        };
        return Result.create(data);
    }

    async update(id: string, dtoData: UpdateResultDTO["data"]) {
        const result = await Result.findById(new mongoose.Types.ObjectId(id));
        if (!result) throw new Error("Result not found");

        const updatedData: Partial<IResult> = {
            score: dtoData.score,
            selectedOption: dtoData.selectedOption ? new mongoose.Types.ObjectId(dtoData.selectedOption) : undefined,
            comment: dtoData.comment
        };

        Object.assign(result, updatedData);
        return result.save();
    }

    async delete(id: string) {
        await Result.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
