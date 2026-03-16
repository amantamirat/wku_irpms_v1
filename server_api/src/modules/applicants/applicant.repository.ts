import Applicant, { IApplicant, IOwnership } from "./applicant.model";
import { CreateApplicantDTO, UpdateApplicantDTO, GetApplicantsDTO, UpdateRolesDTO, ExistsApplicantDTO } from "./applicant.dto";
import mongoose from "mongoose";

export interface IApplicantRepository {
    findById(id: string): Promise<IApplicant | null>;
    findAll(filter?: GetApplicantsDTO): Promise<IApplicant[]>;
    create(data: CreateApplicantDTO): Promise<IApplicant>;
    update(id: string, data: UpdateApplicantDTO["data"]): Promise<IApplicant | null>;
    // Roles management
    updateRoles(userId: string, dto: UpdateRolesDTO): Promise<IApplicant | null>;
    // ownership management
    updateOwnerships(id: string, ownerships: IOwnership[]): Promise<IApplicant | null>;
    exists(filters: ExistsApplicantDTO): Promise<boolean>;
    delete(id: string): Promise<IApplicant | null>;
}


export class ApplicantRepository implements IApplicantRepository {
    // -------------------------
    // FIND BY ID
    // -------------------------

    async findById(id: string, populate?: boolean): Promise<IApplicant | null> {
        if (populate === true) {
            return Applicant.findById(id).
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
        return Applicant.findById(new mongoose.Types.ObjectId(id))
            .lean<IApplicant>()
            .exec();
    }

    // -------------------------
    // FIND ALL WITH OPTIONAL FILTER
    // -------------------------
    async findAll(filter: GetApplicantsDTO): Promise<IApplicant[]> {
        const query: any = {};
        if (filter.workspace) {
            query.workspace = new mongoose.Types.ObjectId(filter.workspace);
        }
        let dbQuery = Applicant.find(query);
        if (filter.populate) {
            dbQuery = dbQuery
                .populate("workspace")
            //.populate("specializations")
        }
        return dbQuery.
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
            fin: dto.fin,
            orcid: dto.orcid,
            // Map roles to ObjectIds
            roles: dto.roles?.map(role => new mongoose.Types.ObjectId(role)),
            // Map specializations to ObjectIds
            specializations: dto.specializations?.map(spec => new mongoose.Types.ObjectId(spec)),
            // Ensure accessibility is at least an empty array
            accessibility: dto.accessibility ?? [],
            // Map the DTO "ownerships" to the Schema "ownership" field
            ownerships: dto.ownerships ?? []
        };

        return Applicant.create(data);
    }
    // -------------------------
    // UPDATE
    // -------------------------
    async update(id: string, dtoData: UpdateApplicantDTO["data"]): Promise<IApplicant | null> {
        const toUpdate: any = {};

        if (dtoData.workspace) toUpdate.organization = new mongoose.Types.ObjectId(dtoData.workspace);
        if (dtoData.name) toUpdate.name = dtoData.name;
        if (dtoData.birthDate) toUpdate.birth_date = dtoData.birthDate;
        if (dtoData.gender) toUpdate.gender = dtoData.gender;
        if (dtoData.fin) toUpdate.fin = dtoData.fin;
        if (dtoData.orcid) toUpdate.orcid = dtoData.orcid;
        if (dtoData.accessibility) toUpdate.accessibility = dtoData.accessibility;
        if (dtoData.specializations) {
            toUpdate.specializations = dtoData.specializations?.map(id => new mongoose.Types.ObjectId(id))
        }
        return Applicant.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: toUpdate },
            { new: true }
        ).lean<IApplicant>();

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

    async exists(filters: ExistsApplicantDTO): Promise<boolean> {
        const query: any = {};
        if (filters.workspace) {
            query.workspace = new mongoose.Types.ObjectId(filters.workspace);
        }
        if (filters.specialization) {
            query.specializations = new mongoose.Types.ObjectId(filters.specialization);
            // This automatically checks if the array contains the ObjectId
        }
        if (filters.role) {
            query.roles = new mongoose.Types.ObjectId(filters.role);
        }
        const result = await Applicant.exists(query).exec();
        return result !== null;
    }
    // -------------------------
    // DELETE
    // -------------------------
    async delete(id: string): Promise<IApplicant | null> {
        return Applicant.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
    }
}

