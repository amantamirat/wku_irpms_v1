import mongoose from "mongoose";
import { Experience, IExperience } from "./experience.model";
import { CreateExperienceDTO, UpdateExperienceDTO } from "./experience.dto";

export interface IExperienceRepository {
    findById(id: string): Promise<IExperience | null>;
    findByApplicant(applicantId: string): Promise<Partial<any>[]>;
    create(data: CreateExperienceDTO): Promise<IExperience>;
    update(id: string, data: UpdateExperienceDTO["data"]): Promise<IExperience>;
    delete(id: string): Promise<void>;
}

export class ExperienceRepository implements IExperienceRepository {

    async findById(id: string) {
        return Experience.findById(new mongoose.Types.ObjectId(id))
            .lean<IExperience>()
            .exec();
    }

    async findByApplicant(applicantId: string) {
        return Experience.find({
            applicant: new mongoose.Types.ObjectId(applicantId)
        })
            .populate("organization rank")
            .lean<IExperience[]>()
            .exec();
    }

    async create(dto: CreateExperienceDTO) {
        const data: Partial<IExperience> = {
            applicant: new mongoose.Types.ObjectId(dto.applicantId),
            jobTitle: dto.jobTitle,
            organization: new mongoose.Types.ObjectId(dto.organizationId),
            rank: new mongoose.Types.ObjectId(dto.rankId),
            startDate: dto.startDate,
            endDate: dto.endDate ?? null,
            isCurrent: dto.isCurrent,
            employmentType: dto.employmentType
        };

        return Experience.create(data);
    }

    async update(id: string, dtoData: UpdateExperienceDTO["data"]) {
        const exp = await Experience.findById(new mongoose.Types.ObjectId(id));
        if (!exp) {
            throw new Error("Experience not found");
        }

        const updatedData: Partial<IExperience> = {
            jobTitle: dtoData.jobTitle,
            startDate: dtoData.startDate,
            endDate: dtoData.endDate,
            isCurrent: dtoData.isCurrent,
            employmentType: dtoData.employmentType,
            organization: dtoData.organizationId
                ? new mongoose.Types.ObjectId(dtoData.organizationId)
                : undefined,
            rank: dtoData.rankId
                ? new mongoose.Types.ObjectId(dtoData.rankId)
                : undefined
        };

        Object.assign(exp, updatedData);
        return exp.save();
    }

    async delete(id: string) {
        await Experience.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}
