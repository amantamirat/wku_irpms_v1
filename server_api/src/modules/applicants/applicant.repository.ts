import Applicant, { IApplicant, IOwnership } from "./applicant.model";
import { CreateApplicantDTO, UpdateApplicantDTO, GetApplicantsDTO, FindApplicantDTO, UpdateRolesDTO } from "./applicant.dto";
import mongoose from "mongoose";

export interface IApplicantRepository {
    findOne(option: Partial<FindApplicantDTO>): Promise<IApplicant | null>;
    findAll(filter?: GetApplicantsDTO): Promise<IApplicant[]>;
    create(data: CreateApplicantDTO): Promise<IApplicant>;
    update(id: string, data: UpdateApplicantDTO["data"]): Promise<IApplicant>;
    // Roles management
    updateRoles(userId: string, dto: UpdateRolesDTO): Promise<IApplicant | null>;
    // ownership management
    updateOwnerships(id: string, ownerships: IOwnership[]): Promise<IApplicant | null>;
    delete(id: string): Promise<IApplicant | null>;
}


export class ApplicantRepository implements IApplicantRepository {
    // -------------------------
    // FIND BY ID
    // -------------------------
    async findOne(option: Partial<FindApplicantDTO>): Promise<IApplicant | null> {
        const query: any = {};

        if (option.id) {
            query._id = new mongoose.Types.ObjectId(option.id);
        }
        if (option.email) {
            query.email = option.email;
        }
        return Applicant.findOne(query).
            populate("workspace").
            populate({
                path: "roles",
                populate: {
                    path: "permissions"
                }
            }).
            populate("ownerships").
            lean<IApplicant>().
            exec();
    }
    // -------------------------
    // FIND ALL WITH OPTIONAL FILTER
    // -------------------------
    async findAll(filter: GetApplicantsDTO = {}): Promise<IApplicant[]> {
        const query: any = {};

        if (filter.workspace) {
            query.workspace = new mongoose.Types.ObjectId(filter.workspace);
        }

        return Applicant.find(query).
            populate("workspace").
            populate("specializations").
            //populate("roles").
            //populate("ownerships").
            lean<IApplicant[]>()
            .exec();
    }
    // -------------------------
    // CREATE
    // -------------------------
    async create(dto: CreateApplicantDTO): Promise<IApplicant> {
        const data: Partial<IApplicant> = {
            workspace: dto.workspace ? new mongoose.Types.ObjectId(dto.workspace) : undefined,
            name: dto.name,
            birthDate: dto.birthDate,
            gender: dto.gender,
            email: dto.email,
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

        if (dtoData.workspace) toUpdate.organization = new mongoose.Types.ObjectId(dtoData.workspace);
        if (dtoData.name) toUpdate.name = dtoData.name;
        //if (dtoData.lastName) toUpdate.last_name = dtoData.lastName;
        if (dtoData.birthDate) toUpdate.birth_date = dtoData.birthDate;
        if (dtoData.gender) toUpdate.gender = dtoData.gender;
        if (dtoData.email) toUpdate.email = dtoData.email;
        if (dtoData.fin) toUpdate.fin = dtoData.fin;
        if (dtoData.orcid) toUpdate.orcid = dtoData.orcid;
        if (dtoData.accessibility) toUpdate.accessibility = dtoData.accessibility;
        if (dtoData.specializations) {
            toUpdate.specializations = dtoData.specializations?.map(id => new mongoose.Types.ObjectId(id))
        }

        /*

        if (dtoData.ownerships) {
            toUpdate.ownerships = dtoData.ownerships?.map(id => new mongoose.Types.ObjectId(id))
        }

        */

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
    // ROLES UPDATE
    // -------------------------
    async updateRoles(id: string, dto: UpdateRolesDTO): Promise<IApplicant | null> {

        return Applicant.findByIdAndUpdate(
            id,
            { $set: { roles: dto.roles.map(id => new mongoose.Types.ObjectId(id)), updatedAt: new Date() } },
            { new: true }
        ).lean<IApplicant>();

        //if (!updated) throw new Error("User not found");
        // Optional: audit log
        // await AuditLog.create({ actor: dto.updatedBy, action: "user:role:update", target: userId, payload: dto.roles });
        //return updated;
    }
    // -------------------------
    // OWNERSHIP UPDATE
    // -------------------------
    async updateOwnerships(id: string, ownerships: IOwnership[]) {
        return Applicant.findByIdAndUpdate(
            id,
            { ownerships },
            { new: true }
        );
    }
    // -------------------------
    // DELETE
    // -------------------------
    async delete(id: string): Promise<IApplicant | null> {
        return Applicant.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

