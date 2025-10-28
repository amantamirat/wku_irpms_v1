import mongoose from "mongoose";
import { Composition } from "./composition.model";
import { ApplicantConstraint } from "../constraint.model";
import { ApplicantConstraintType, isListConstraint, isRangeConstraint, OperationMode } from "../constraint.enum";

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
            throw new Error("Applicant constraint must be specified for composition.");
        }
        const parentConstraint = await ApplicantConstraint.findById(data.parent);
        if (!parentConstraint) {
            throw new Error("Applicant constraint not found for composition.");
        }
        const mode = parentConstraint.mode;
        if (mode === OperationMode.RATIO) {
            if ((!data.value && data.value !== 0) || data.value < 0 || data.value > 1) {
                throw new Error("Value must be a ratio (between 0 and 1) for ratio-based composition constraints.");
            }
        }
        else if (mode === OperationMode.COUNT) {
            if ((!data.value && data.value !== 0)) {
                throw new Error("Value must be specified for count-based composition constraints.");
            }
        }

        const applicantType = parentConstraint.constraint;
        if (isRangeConstraint(applicantType as ApplicantConstraintType)) {
            if ((!data.max || !data.min)) {
                throw new Error(`Range must be specified for ${applicantType} constraint.`);
            }
        }
        else if (isListConstraint(applicantType as ApplicantConstraintType)) {
            if (!data.item) {
                throw new Error(`Item must be specified for ${applicantType} constraint.`);
            }
        }
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
