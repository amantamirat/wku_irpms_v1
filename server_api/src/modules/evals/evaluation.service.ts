import { Types } from "mongoose";
import { EvalType } from "./enums/eval.type.enum";
import { FormType } from "./enums/from.type.enum";
import { BaseEvaluation } from "./base.evaluation.model";
import Organization from "../organizations/organization.model";
import { Unit } from "../organizations/enums/unit.enum";
import { Stage } from "./stage.model";

export interface GetEvalsOptions {
    type?: EvalType;
    parent?: string;
    directorate?: string;
}

export interface CreateEvaluationDto {
    type: EvalType;
    title: string;
    directorate?: Types.ObjectId;
    parent?: Types.ObjectId;
    stage_level?: number;
    weight_value?: number;
    form_type?: FormType;
}


export class EvaluationService {

    private static async validateEval(evl: Partial<CreateEvaluationDto>) {
        if (evl.type === EvalType.evaluation || evl.type === EvalType.validation) {
            const directorate = await Organization.findById(evl.directorate);
            if (!directorate || directorate.type !== Unit.Directorate) {
                throw new Error("Directorate Not Found!");
            }
            return
        }
        const expectedParentType =
            evl.type === EvalType.stage ? [EvalType.evaluation, EvalType.validation]
                : evl.type === EvalType.criterion ? EvalType.stage
                    : EvalType.criterion;

        const parentEval = await BaseEvaluation.findById(evl.parent).lean() as any;
        if (!parentEval) throw new Error(`Parent evaluation not found for '${evl.type}'.`);

        if (Array.isArray(expectedParentType)
            ? !expectedParentType.includes(parentEval.type)
            : parentEval.type !== expectedParentType) {
            throw new Error(
                `'${evl.type}' must have a parent of type '${Array.isArray(expectedParentType) ? expectedParentType.join("' or '") : expectedParentType}'.`
            );
        }

        if (evl.type === EvalType.option) {
            if (!evl.weight_value || !parentEval.weight_value) {
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
        if (type === EvalType.stage) {
            const maxStage = await Stage.findOne({
                parent: data.parent
            })
                .sort({ stage_level: -1 })
                .select('stage_level')
                .lean();
            rest.stage_level = maxStage ? (maxStage.stage_level ?? 0) + 1 : 1;
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
        if (data.type === EvalType.stage) {
            delete data.stage_level;
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
        try {
            if (!['up', 'down'].includes(direction)) {
                throw new Error('Direction must be "up" or "down".');
            }
            const current = await Stage.findById(id).lean();
            if (!current || current.type !== EvalType.stage) {
                throw new Error('Stage not found.');
            }
            const level = current.stage_level;
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
            const currentLevel = current.stage_level!;
            const targetLevel = target.stage_level!;

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
            return {
                success: true,
                status: 200,
                message: `Stage moved ${direction} successfully.`,
            };
        } catch (err: any) {
            console.error(err);
            return {
                success: false,
                status: 400,
                message: err.message || 'Failed to reorder stage.',
            };
        }
    }
}
