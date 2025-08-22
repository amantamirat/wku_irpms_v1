import { Types } from "mongoose";
import { Evaluation } from "../evals/evaluation.model";
import { Unit } from "../organizations/enums/unit.enum";
import Organization from "../organizations/organization.model";
import { Catalog } from "../themes/catalog.theme.model";
import { Grant } from "./grant.model";


export interface GetGrantsOptions {
    directorate?: string;
}


export interface CreateGrantDto {
    directorate: Types.ObjectId | string;
    title: string;
    description?: string;
    theme: Types.ObjectId | string;
    evaluation: Types.ObjectId | string;
}


export class GrantService {

    private static async validateGrant(grant: Partial<CreateGrantDto>) {
        const directorate = await Organization.findById(grant.directorate).lean();
        if (!directorate || directorate.type !== Unit.Directorate) {
            throw new Error("Directorate Not Found!");
        }
        const theme = await Catalog.findById(grant.theme).lean();
        if (!theme) {
            throw new Error("Theme Not Found!");
        }
        const evaluation = await Evaluation.findById(grant.evaluation).lean();
        if (!evaluation) {
            throw new Error("Evaluation Not Found!");
        }
    }

    static async createGrant(data: CreateGrantDto) {
        await this.validateGrant(data);
        const createdGrant = await Grant.create({ ...data });
        return createdGrant;
    }

    static async getGrants(options: GetGrantsOptions) {
        const filter: any = {};
        if (options.directorate) filter.directorate = options.directorate;
        return Grant.find(filter).populate('theme').populate('evaluation').lean();
    }

    static async updateGrant(id: string, data: Partial<CreateGrantDto>) {
        const grant = await Grant.findById(id);
        if (!grant) throw new Error("Grant not found");
        await this.validateGrant(data);
        Object.assign(grant, data);
        return grant.save();
    }

    static async deleteGrant(id: string) {
        const grant = await Grant.findById(id);
        if (!grant) throw new Error("Grant not found");
        return await grant.deleteOne();
    }
}
