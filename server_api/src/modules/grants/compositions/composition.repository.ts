import mongoose from "mongoose";
import { Composition, IComposition } from "./composition.model";
import {
    CreateCompositionDTO,
    UpdateCompositionDTO,
    RangeDTO,
    GetCompositionDTO
} from "./composition.dto";

export interface ICompositionRepository {
    findById(id: string): Promise<IComposition | null>;
    find(filters: GetCompositionDTO): Promise<Partial<IComposition>[]>;
    create(dto: CreateCompositionDTO): Promise<IComposition>;
    update(id: string, data: UpdateCompositionDTO["data"]): Promise<IComposition | null>;
    delete(id: string): Promise<IComposition | null>;
}

// MongoDB implementation
export class CompositionRepository implements ICompositionRepository {

    async findById(id: string) {
        return Composition.findById(new mongoose.Types.ObjectId(id))
            .lean<IComposition>()
            .exec();
    }

    async find(filters: GetCompositionDTO) {
        const query: any = {};

        // filter by grant if provided
        if (filters.grant) {
            query.grant = new mongoose.Types.ObjectId(filters.grant);
        }

        let dbQuery = Composition.find(query);

        // populate references if requested
        if (filters.populate) {
            dbQuery = dbQuery.populate("specializations positions grant");
        }

        return dbQuery.lean<IComposition[]>().exec();
    }

    async create(dto: CreateCompositionDTO) {
        const data: Partial<IComposition> = {
            grant: new mongoose.Types.ObjectId(dto.grant),
            title: dto.title,
            gender: dto.gender,
            age: dto.age as RangeDTO,
            experienceYears: dto.experienceYears as RangeDTO,
            accessibility: dto.accessibility || [],
            maxSubmission: dto.maxSubmission,
            minCompletion: dto.minCompletion,
            academicLevels: dto.academicLevels || [],
            specializations: dto.specializations?.map(id => new mongoose.Types.ObjectId(id)),
            positions: dto.positions?.map(id => new mongoose.Types.ObjectId(id)),
            publicationTypes: dto.publicationTypes || [],
            programTypes: dto.programTypes || [],
            isPI: dto.isPI || false,
            minCount: dto.minCount
        };

        return Composition.create(data);
    }

    async update(id: string, dtoData: UpdateCompositionDTO["data"]): Promise<IComposition | null> {
        const updateData: Partial<IComposition> = {};

        if (dtoData.title !== undefined) updateData.title = dtoData.title;
        if (dtoData.gender !== undefined) updateData.gender = dtoData.gender;
        if (dtoData.age !== undefined) updateData.age = dtoData.age as RangeDTO;
        if (dtoData.experienceYears !== undefined) updateData.experienceYears = dtoData.experienceYears as RangeDTO;
        if (dtoData.accessibility !== undefined) updateData.accessibility = dtoData.accessibility;
        if (dtoData.maxSubmission !== undefined) updateData.maxSubmission = dtoData.maxSubmission;
        if (dtoData.minCompletion !== undefined) updateData.minCompletion = dtoData.minCompletion;
        if (dtoData.academicLevels !== undefined) updateData.academicLevels = dtoData.academicLevels;
        if (dtoData.specializations !== undefined) updateData.specializations = dtoData.specializations.map(id => new mongoose.Types.ObjectId(id));
        if (dtoData.positions !== undefined) updateData.positions = dtoData.positions.map(id => new mongoose.Types.ObjectId(id));
        if (dtoData.publicationTypes !== undefined) updateData.publicationTypes = dtoData.publicationTypes;
        if (dtoData.programTypes !== undefined) updateData.programTypes = dtoData.programTypes;
        //if (dtoData.isPI !== undefined) updateData.isPI = dtoData.isPI;
        if (dtoData.minCount !== undefined) updateData.minCount = dtoData.minCount;

        return Composition.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async delete(id: string): Promise<IComposition | null> {
        return Composition.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
