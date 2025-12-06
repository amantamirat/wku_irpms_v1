import Applicant, { IApplicant } from "./applicant.model";
import { CreateApplicantDTO, UpdateApplicantDTO, GetApplicantsDTO } from "./applicant.dto";
import mongoose from "mongoose";

export interface IApplicantRepository {
    findById(id: string): Promise<IApplicant | null>;
    findAll(filter?: GetApplicantsDTO): Promise<IApplicant[]>;
    create(data: CreateApplicantDTO): Promise<IApplicant>;
    update(id: string, data: UpdateApplicantDTO["data"]): Promise<IApplicant>;
    delete(id: string): Promise<IApplicant | null>;
}




export class ApplicantRepository implements IApplicantRepository {
    // -------------------------
    // FIND BY ID
    // -------------------------
    async findById(id: string): Promise<IApplicant | null> {
        return Applicant.findById(new mongoose.Types.ObjectId(id))
            .lean<IApplicant>()
            .exec();
    }

    // -------------------------
    // FIND ALL WITH OPTIONAL FILTER
    // -------------------------
    async findAll(filter: GetApplicantsDTO = {}): Promise<IApplicant[]> {
        const query: any = {};

        if (filter.organization) {
            query.organization = new mongoose.Types.ObjectId(filter.organization);
        }

        return Applicant.find(query).populate("organization")
            .lean<IApplicant[]>()
            .exec();
    }

    // -------------------------
    // CREATE
    // -------------------------
    async create(dto: CreateApplicantDTO): Promise<IApplicant> {
        const data: Partial<IApplicant> = {
            organization: dto.organization ? new mongoose.Types.ObjectId(dto.organization) : undefined,
            first_name: dto.first_name,
            last_name: dto.last_name,
            birth_date: dto.birth_date,
            gender: dto.gender,
            fin: dto.fin,
            orcid: dto.orcid,
            accessibility: dto.accessibility ?? []
        };

        return Applicant.create(data);
    }

    // -------------------------
    // UPDATE
    // -------------------------
    async update(id: string, dtoData: UpdateApplicantDTO["data"]): Promise<IApplicant> {
        const toUpdate: any = {};

        if (dtoData.organization) {
            toUpdate.organization = new mongoose.Types.ObjectId(dtoData.organization);
        }

        if (dtoData.first_name) toUpdate.first_name = dtoData.first_name;
        if (dtoData.last_name) toUpdate.last_name = dtoData.last_name;
        if (dtoData.birth_date) toUpdate.birth_date = dtoData.birth_date;
        if (dtoData.gender) toUpdate.gender = dtoData.gender;

        if (dtoData.fin) toUpdate.fin = dtoData.fin;
        if (dtoData.orcid) toUpdate.orcid = dtoData.orcid;

        if (dtoData.accessibility) {
            toUpdate.accessibility = dtoData.accessibility;
        }

        const updated = await Applicant.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IApplicant>();

        if (!updated) {
            throw new Error("Applicant not found.");
        }

        return updated;
    }

    // -------------------------
    // DELETE
    // -------------------------
    async delete(id: string): Promise<IApplicant | null> {
        return Applicant.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

