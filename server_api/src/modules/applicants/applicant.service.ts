import mongoose from "mongoose";
import Applicant from "./applicant.model";
import { Gender, Accessibility, Scope } from "./applicant.enum";
import { BaseOrganization } from "../organization/organization.model";
import { Unit } from "../organization/organization.enum";
import { User } from "../users/user.model";

export interface GetApplicantsOptions {
    organization?: mongoose.Types.ObjectId;
    scope?: Scope;
}

export interface CreateApplicantDto {
    first_name: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    scope: Scope;
    organization: mongoose.Types.ObjectId;
    email?: string;
    accessibility?: Accessibility[];
    user?: mongoose.Types.ObjectId;
}

const scopeToOrganizationUnit: Record<Scope, Unit> = {
    Academic: Unit.Department,
    Supportive: Unit.Supportive,
    External: Unit.External,
};

export class ApplicantService {

    private static async validateApplicant(applicant: Partial<CreateApplicantDto>) {
        if (applicant.scope && applicant.organization) {
            const expected = scopeToOrganizationUnit[applicant.scope];
            const org = await BaseOrganization.findById(applicant.organization);
            if (!org || org.type !== expected) {
                throw new Error(`Scope ${applicant.scope} requires organization of unit ${expected}`);
            }
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
        return await Applicant.find(filter).populate('organization').lean();
    }

    static async updateApplicant(id: string, data: Partial<CreateApplicantDto>) {
        await this.validateApplicant(data);
        const applicant = await Applicant.findById(id);
        if (!applicant) throw new Error("Applicant not found");
        Object.assign(applicant, data);
        return await applicant.save();
    }

    static async deleteApplicant(id: string) {
        const applicant = await Applicant.findById(id);
        if (!applicant) throw new Error("Applicant not found");
        return await applicant.deleteOne();
    }

    static async autoLinkUserByEmail(applicantId: string) {
        const applicant = await Applicant.findById(applicantId);
        if (!applicant) throw new Error("Applicant not found");
        if (!applicant.email) throw new Error("Applicant has no email to link");
        if (applicant.user) throw new Error("This user is already linked to another applicant");
        const user = await User.findOne({ email: applicant.email });
        if (!user) throw new Error("No user account found with this email");
        applicant.user = user._id as mongoose.Types.ObjectId;;
        await applicant.save();
        return applicant;
    }


}
