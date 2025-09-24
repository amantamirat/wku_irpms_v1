import { Types } from "mongoose";
import { EvaluationType, FormType } from "./evaluation.enum";

import { Directorate } from "../organs/base.organization.model";
import { BaseEvaluation, Stage } from "./evaluation.model";

export interface GetEvalsOptions {
    type?: EvaluationType;
    parent?: string;
    directorate?: string;
}

export interface CreateEvaluationDto {
    type: EvaluationType;
    title: string;
    directorate?: Types.ObjectId;
    parent?: Types.ObjectId;
    order?: number;
    weight_value?: number;
    form_type?: FormType;
}


export class EvaluationService {

    private static async validateEval(evl: Partial<CreateEvaluationDto>) {
        if (evl.type === EvaluationType.evaluation || evl.type === EvaluationType.validation) {
            const directorate = await Directorate.findById(evl.directorate);
            if (!directorate) {
                throw new Error("Directorate Not Found!");
            }
            return
        }
        const expectedParentType =
            evl.type === EvaluationType.stage ? [EvaluationType.evaluation, EvaluationType.validation]
                : evl.type === EvaluationType.criterion ? EvaluationType.stage
                    : EvaluationType.criterion;

        const parentEval = await BaseEvaluation.findById(evl.parent).lean() as any;
        if (!parentEval) throw new Error(`Parent evaluation not found for '${evl.type}'.`);

        if (Array.isArray(expectedParentType)
            ? !expectedParentType.includes(parentEval.type)
            : parentEval.type !== expectedParentType) {
            throw new Error(
                `'${evl.type}' must have a parent of type '${Array.isArray(expectedParentType) ? expectedParentType.join("' or '") : expectedParentType}'.`
            );
        }

        if (evl.type === EvaluationType.option) {
            if (evl.weight_value === undefined || evl.weight_value === null || !parentEval.weight_value) {
                throw new Error("Weight Value is Not Found");
            }
            if (evl.weight_value > parentEval.weight_value) {
                throw new Error(`The provided value (${evl.weight_value}) must be less than or equal to the criterion weight (${parentEval.weight_value}).`);
            }
        }
    }

    static async createEvaluation(data: CreateEvaluationDto) {
        const { type, ...rest } = data;
        await this.validateEval(data);
        if (!BaseEvaluation.discriminators || !BaseEvaluation.discriminators[type]) {
            throw new Error(`Invalid Evaluation type: ${type}`);
        }
        if (type === EvaluationType.stage) {
            const maxStage = await Stage.findOne({
                parent: data.parent
            })
                .sort({ order: -1 })
                .select('stage_level')
                .lean();
            rest.order = maxStage ? (maxStage.order ?? 0) + 1 : 1;
        }

        const createdEvaluation = await BaseEvaluation.create({ type, ...rest });
        return createdEvaluation;
    }

    static async getEvaluations(options: GetEvalsOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        if (options.directorate) filter.directorate = options.directorate;
        return BaseEvaluation.find(filter).lean();
    }

    static async updateEvaluation(id: string, data: Partial<CreateEvaluationDto>) {
        const evaluation = await BaseEvaluation.findById(id);
        if (!evaluation) throw new Error("Evaluation not found");
        await this.validateEval(data);
        if (data.type && data.type !== evaluation.type) {
            throw new Error("Cannot change theme type");
        }
        if (data.type === EvaluationType.stage) {
            delete data.order;
        }
        Object.assign(evaluation, data);
        return evaluation.save();
    }

    static async deleteEvaluation(id: string) {
        const evaluation = await BaseEvaluation.findById(id);
        if (!evaluation) throw new Error("Evaluation not found");
        return await evaluation.deleteOne();
    }


    static async reorderStageLevel(id: string, direction: string) {
        if (!['up', 'down'].includes(direction)) {
            throw new Error('Direction must be "up" or "down".');
        }
        const current = await Stage.findById(id).lean();
        if (!current || current.type !== EvaluationType.stage) {
            throw new Error('Stage not found.');
        }
        const level = current.order;
        if (typeof level !== 'number') {
            throw new Error('Current stage level is not defined.');
        }
        const target = await Stage.findOne({
            parent: current.parent,
            stage_level: direction === 'up' ? level - 1 : level + 1
        });
        if (!target) {
            throw new Error(`Cannot move ${direction} any further.`);
        }
        const currentLevel = current.order!;
        const targetLevel = target.order!;

        await Stage.updateOne(
            { _id: current._id },
            { $set: { stage_level: -1 } },
            { runValidators: false } // Bypass min/max validation
        );
        // Swap stage levels using bulkWrite
        await Stage.updateOne(
            { _id: target._id },
            { $set: { stage_level: currentLevel } }
        );
        // 3. Move current into target's position
        await Stage.updateOne(
            { _id: current._id },
            { $set: { stage_level: targetLevel } }
        );
        return true;
    }
}
