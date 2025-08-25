import { Types } from "mongoose";
import Applicant from "./applicant.model";
import { Gender } from "./enums/gender.enum";
import { Category } from "../organs/enums/category.enum";
import { Accessibility } from "./enums/accessibility.enum";
import { Unit } from "../organs/enums/unit.enum";
import { BaseOrganization } from "../organs/base.organization.model";


export interface GetApplicantsOptions {
    organization?: Types.ObjectId | string;
    scope?: Category;
}

export interface CreateApplicantDto {
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    scope: Category;
    organization: Types.ObjectId | string;
    accessibility?: Accessibility[];
}

const scopeToOrganizationUnit: Record<Category, Unit> = {
    academic: Unit.Department,
    supportive: Unit.Supportive,
    external: Unit.External,
};

export class ApplicantService {

    private static async validateApplicant(applicant: Partial<CreateApplicantDto>) {
        const expected = scopeToOrganizationUnit[applicant.scope!];
        const org = await BaseOrganization.findById(applicant.organization);
        if (!org || org.type !== expected) {
            throw new Error(`Scope ${applicant.scope!} requires organization of unit ${expected}`);
        }
    }

    static async createApplicant(data: CreateApplicantDto) {
        await this.validateApplicant(data);
        const createdApplicant = await Applicant.create({ ...data });
        return createdApplicant;
    }

    static async getApplicants(options: GetApplicantsOptions) {
        const filter: any = {};
        if (options.scope) filter.scope = options.scope;
        if (options.organization) filter.organization = options.organization;
        return Applicant.find(filter).populate('organization').lean();
    }

    static async updateApplicant(id: string, data: Partial<CreateApplicantDto>) {
        await this.validateApplicant(data);
        const applicant = await Applicant.findById(id);
        if (!applicant) throw new Error("Applicant not found");
        Object.assign(applicant, data);
        return applicant.save();
    }

    static async deleteApplicant(id: string) {
        const applicant = await Applicant.findById(id);
        if (!applicant) throw new Error("Applicant not found");
        return await applicant.deleteOne();
    }
}
