import mongoose from "mongoose";
import { Experience, IExperience } from "./experience.model";
import { CreateExperienceDTO, ExistExperienceDTO, GetExperiencesDTO, UpdateExperienceDTO } from "./experience.dto";

export interface IExperienceRepository {
    findById(id: string): Promise<IExperience | null>;
    find(filters: GetExperiencesDTO): Promise<Partial<IExperience>[]>;
    create(data: CreateExperienceDTO): Promise<IExperience>;
    update(id: string, data: UpdateExperienceDTO["data"]): Promise<IExperience | null>;
    exists(filters: ExistExperienceDTO): Promise<boolean>;
    delete(id: string): Promise<IExperience | null>;
}

export class ExperienceRepository implements IExperienceRepository {

    async findById(id: string) {
        return Experience.findById(new mongoose.Types.ObjectId(id))
            .lean<IExperience>()
            .exec();
    }

    async find(filters: GetExperiencesDTO) {
        const query: any = {};

        if (filters.applicant) {
            query.applicant = new mongoose.Types.ObjectId(filters.applicant);
        }

        if (filters.organization) {
            query.organization = new mongoose.Types.ObjectId(filters.organization);
        }

        let dbQuery = Experience.find(query);

        if (filters.populate) {
            dbQuery = dbQuery.populate("applicant organization position rank");
        }

        return dbQuery.lean<IExperience[]>().exec();
    }

    async create(dto: CreateExperienceDTO) {
        const data: Partial<IExperience> = {
            applicant: new mongoose.Types.ObjectId(dto.applicant),
            position: new mongoose.Types.ObjectId(dto.position),
            organization: new mongoose.Types.ObjectId(dto.organization),
            rank: new mongoose.Types.ObjectId(dto.rank),
            startDate: dto.startDate,
            endDate: dto.endDate ?? null,
            isCurrent: dto.isCurrent,
            employmentType: dto.employmentType
        };

        return Experience.create(data);
    }

    async update(
        id: string,
        dtoData: UpdateExperienceDTO["data"]
    ): Promise<IExperience | null> {

        const updateData: any = {};

        if (dtoData.position !== undefined)
            updateData.position = new mongoose.Types.ObjectId(dtoData.position);

        if (dtoData.startDate !== undefined)
            updateData.startDate = dtoData.startDate;

        if (dtoData.endDate !== undefined)
            updateData.endDate = dtoData.endDate;

        if (dtoData.isCurrent !== undefined)
            updateData.isCurrent = dtoData.isCurrent;

        if (dtoData.employmentType !== undefined)
            updateData.employmentType = dtoData.employmentType;

        if (dtoData.organization !== undefined)
            updateData.organization = new mongoose.Types.ObjectId(dtoData.organization);

        if (dtoData.rank !== undefined)
            updateData.rank = new mongoose.Types.ObjectId(dtoData.rank);

        return Experience.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    async exists(filters: ExistExperienceDTO): Promise<boolean> {
        const query: any = {};
        if (filters.applicant) {
            query.applicant = new mongoose.Types.ObjectId(filters.applicant);
        }
        if (filters.organization) {
            query.organization = new mongoose.Types.ObjectId(filters.organization);
        }
        if (filters.rank) {
            query.rank = new mongoose.Types.ObjectId(filters.rank);
        }
        const result = await Experience.exists(query).exec();
        return result !== null;
    }

    async delete(id: string) {
        return await Experience.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
