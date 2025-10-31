import mongoose from "mongoose";
import { Criterion } from "./criteria/criterion.model";
import { CacheService } from "../../util/cache/cache.service";
import { Directorate } from "../organization/organization.model";
import { Evaluation } from "./evaluation.model";
import { CreateEvaluationDTO, UpdateEvaluationDTO } from "./evaluation.dto";

export class EvaluationService {
    
    static async createEvaluation(dto: CreateEvaluationDTO) {
        const {  directorate, title, userId } = dto;

        // Validate ownership
        await CacheService.validateOwnership(userId, directorate);

        // Validate directorate
        const dir = await Directorate.findById(directorate);
        if (!dir) throw new Error("Directorate not found.");

        const evalDoc = await Evaluation.create({
            directorate: directorate,
            title,
        });

        return evalDoc;
    }

    static async getEvaluations(directorate?: mongoose.Types.ObjectId) {
        const filter: any = {};
        if (directorate) filter.directorate = directorate;

        return await Evaluation.find(filter)
            .populate("directorate")
            .sort({ createdAt: -1 })
            .lean();
    }


    static async getUserEvaluations(userId: string) {
        const orgs = await CacheService.getUserOrganizations(userId);
        if (!orgs.length) {
            return [];
        }
        const evals = await Evaluation.find({ directorate: { $in: orgs } }).populate('directorate').lean();
        return evals;
    }

    static async updateEvaluation(dto: UpdateEvaluationDTO) {
        const { id, data, userId } = dto;

        const evalDoc = await Evaluation.findById(id);
        if (!evalDoc) throw new Error("Evaluation not found");

        await CacheService.validateOwnership(userId, evalDoc.directorate);

        Object.assign(evalDoc, data);
        return evalDoc.save();
    }

    static async deleteEvaluation(id: string, userId: string) {
        const evalDoc = await Evaluation.findById(id);
        if (!evalDoc) throw new Error("Evaluation not found");

        await CacheService.validateOwnership(userId, evalDoc.directorate);

        const countCriteria = await Criterion.countDocuments({ evaluation: id });
        if (countCriteria > 0)
            throw new Error("Cannot delete evaluation with existing criteria.");

        return await evalDoc.deleteOne();
    }
}
