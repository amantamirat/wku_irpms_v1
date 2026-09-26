//result.repository.ts
import mongoose from "mongoose";
import { Result, IResult } from "./result.model";
import { CreateResultDTO, FilterResultsDTO, UpdateResultDTO } from "./result.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";

export interface IResultRepository {
    findById(id: string): Promise<IResult | null>;
    find(filters: FilterResultsDTO, options?: FilterOptions): Promise<Partial<IResult>[]>;
    //create(data: CreateResultDTO): Promise<IResult>;
    insertMany(data: CreateResultDTO[]): Promise<IResult[]>;
    update(id: string, data: UpdateResultDTO["data"]): Promise<IResult | null>;
    exists(filters: FilterResultsDTO): Promise<boolean>;
    delete(id: string): Promise<void>;
    deleteByReviewer(reviewerId: string): Promise<number>;
}

// MongoDB implementation
export class ResultRepository implements IResultRepository {

    async findById(id: string) {
        return Result.findById(new mongoose.Types.ObjectId(id)).lean<IResult>().exec();
    }

    async find(filters: FilterResultsDTO, options?: FilterOptions) {
        const query: any = {};

        if (filters.reviewer) {
            query.reviewer = new mongoose.Types.ObjectId(filters.reviewer);
        }

        let dbQuery = Result.find(query);

        if (options?.populate) {
            dbQuery = dbQuery.populate("criterion");
        }

        return dbQuery.lean<IResult[]>().exec();
    }

    /*
    async create(dto: CreateResultDTO) {
        const data: Partial<IResult> = {
            reviewer: new mongoose.Types.ObjectId(dto.reviewer),
            criterion: new mongoose.Types.ObjectId(dto.criterion),
            selectedOptions: dto.selectedOptions ? new mongoose.Types.ObjectId(dto.selectedOptions) : undefined,
            score: dto.score ?? null,
            comment: dto.comment
        };
        return Result.create(data);
    }
        */

    async insertMany(dtos: CreateResultDTO[]): Promise<IResult[]> {
        if (!dtos.length) return [];

        const docs = dtos.map(dto => ({
            reviewer: new mongoose.Types.ObjectId(dto.reviewer),
            criterion: new mongoose.Types.ObjectId(dto.criterion),
            //score: dto.score ?? null
        }));

        return Result.insertMany(docs, { ordered: false });
    }

    async update(id: string, dtoData: UpdateResultDTO["data"]): Promise<IResult | null> {
        const updateData: Partial<IResult> = {};

        if (dtoData.score !== undefined) {
            updateData.score = dtoData.score;
        }

        if (dtoData.selectedOptions !== undefined) {
            updateData.selectedOptions = dtoData.selectedOptions.length > 0
                ? dtoData.selectedOptions.map(id => new mongoose.Types.ObjectId(id))
                : [];
        }

        if (dtoData.comment !== undefined) {
            updateData.comment = dtoData.comment;
        }

        return Result.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: FilterResultsDTO): Promise<boolean> {
        const query: any = {};

        if (filters.reviewer) {
            query.reviewer = new mongoose.Types.ObjectId(filters.reviewer);
        }

        if (filters.criterion) {
            query.criterion = new mongoose.Types.ObjectId(filters.criterion);
        }

        /*
        if (filters.selectedOption) {
            query.selectedOption = new mongoose.Types.ObjectId(filters.selectedOption);
        }
        */

        const result = await Result.exists(query).exec();
        return result !== null;
    }


    async delete(id: string) {
        await Result.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }

    async deleteByReviewer(reviewerId: string): Promise<number> {
        const result = await Result.deleteMany({
            reviewer: new mongoose.Types.ObjectId(reviewerId)
        }).exec();

        return result.deletedCount ?? 0;
    }
}
