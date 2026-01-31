//result.repository.ts
import mongoose from "mongoose";
import { Result, IResult } from "./result.model";
import { CreateResultDTO, ExistsResultsDTO, GetResultsDTO, UpdateResultDTO } from "./result.dto";

export interface IResultRepository {
    findById(id: string): Promise<IResult | null>;
    find(options: GetResultsDTO): Promise<Partial<IResult>[]>;
    create(data: CreateResultDTO): Promise<IResult>;
    update(id: string, data: UpdateResultDTO["data"]): Promise<IResult>;
    exists(filters: ExistsResultsDTO): Promise<boolean>;
    delete(id: string): Promise<void>;
}

// MongoDB implementation
export class ResultRepository implements IResultRepository {

    async findById(id: string) {
        return Result.findById(new mongoose.Types.ObjectId(id)).lean<IResult>().exec();
    }

    async find(options: GetResultsDTO) {
        const query: any = {};

        if (options.reviewer) {
            query.reviewer = new mongoose.Types.ObjectId(options.reviewer);
        }

        let dbQuery = Result.find(query);

        if (options.populate) {
            dbQuery = dbQuery.populate("criterion selectedOption");
        }

        return dbQuery.lean<IResult[]>().exec();
    }

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

    async exists(filters: ExistsResultsDTO): Promise<boolean> {
        const query: any = {};

        if (filters.reviewer) {
            query.reviewer = new mongoose.Types.ObjectId(filters.reviewer);
        }

        if (filters.criterion) {
            query.criterion = new mongoose.Types.ObjectId(filters.criterion);
        }

        if (filters.selectedOption) {
            query.selectedOption = new mongoose.Types.ObjectId(filters.selectedOption);
        }

        const result = await Result.exists(query).exec();
        return result !== null;
    }


    async delete(id: string) {
        await Result.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
