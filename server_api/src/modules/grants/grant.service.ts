import mongoose from "mongoose";
import { Call } from "../call/call.model";
import { Directorate } from "../organization/organization.model";
import { Grant } from "./grant.model";
import { CacheService } from "../../util/cache/cache.service";


export interface GetGrantsOptions {
    directorate?: mongoose.Types.ObjectId;
}

export interface CreateGrantDto {
    directorate: mongoose.Types.ObjectId;
    title: string;
    description?: string;
}


export class GrantService {

    private static async validateGrant(grant: Partial<CreateGrantDto>) {
        const directorate = await Directorate.findById(grant.directorate).lean();
        if (!directorate) {
            throw new Error("Directorate Not Found!");
        }
    }

    static async createGrant(data: CreateGrantDto, userId: string) {
        await CacheService.validateOwnership(userId, data.directorate);
        await this.validateGrant(data);
        const createdGrant = await Grant.create({ ...data });
        return createdGrant;
    }

    static async getGrants(options: GetGrantsOptions) {
        const filter: any = {};
        if (options.directorate) filter.directorate = options.directorate;
        return await Grant.find(filter).populate('directorate').lean();
    }


    static async getUserGrants(userId: string) {
        const organizations = await CacheService.getUserOrganizations(userId);
        return await Grant.find({ directorate: { $in: organizations } }).populate('directorate').lean();
    }


    static async updateGrant(id: string, data: Partial<CreateGrantDto>, userId: string) {
        const grant = await Grant.findById(id);
        if (!grant) throw new Error("Grant not found");
        await CacheService.validateOwnership(userId, grant.directorate);
        Object.assign(grant, data);
        return grant.save();
    }

    static async deleteGrant(id: string, userId: string) {
        const grant = await Grant.findById(id);
        if (!grant) throw new Error("Grant not found");
        await CacheService.validateOwnership(userId, grant.directorate);
        const referencedByCall = await Call.exists({ grant: grant._id });
        if (referencedByCall) throw new Error(`Can not delete ${grant.title}, it is referenced in call.`);
        return await grant.deleteOne();
    }
}
