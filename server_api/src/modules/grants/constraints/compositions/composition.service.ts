import mongoose from "mongoose";
import { Composition } from "./composition.model";
import { ApplicantConstraint } from "../constraint.model";

export interface CreateCompositionDto {
    parent: mongoose.Types.ObjectId;
    value: number;
    max?: number;
    min?: number;
    item?: string;
}

export interface GetCompositionOptions {
    parent?: mongoose.Types.ObjectId;
}

export class CompositionService {
    static async validateComposition(data: Partial<CreateCompositionDto>) {
        if (!data.parent) {
            throw new Error("Parent applicant constraint must be specified for composition.");
        }
        const parentConstraint = await ApplicantConstraint.findById(data.parent);
        if (!parentConstraint) {
            throw new Error("Parent applicant constraint not found for composition.");
        }
        // Add more validation logic as needed (similar to ConstraintService)
        // For example, check value, min, max, item based on parentConstraint.mode
    }

    static async createComposition(data: CreateCompositionDto) {
        await this.validateComposition(data);
        const createdComposition = await Composition.create({ ...data });
        return createdComposition;
    }

    static async getCompositions(options: GetCompositionOptions = {}) {
        const filter: any = {};
        if (options.parent) {
            filter.parent = options.parent;
        }
        return await Composition.find(filter).populate("parent").lean();
    }

    static async updateComposition(id: string, data: Partial<CreateCompositionDto>) {
        const composition = await Composition.findById(id);
        if (!composition) throw new Error("Composition not found");
        Object.assign(composition, data);
        return await composition.save();
    }

    static async deleteComposition(id: string) {
        const composition = await Composition.findById(id);
        if (!composition) throw new Error("Composition not found");
        return await composition.deleteOne();
    }
}
