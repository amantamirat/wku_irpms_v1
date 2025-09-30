import { EvaluationType, FormType } from "./evaluation.enum";
import { BaseEvaluation, Criterion, Evaluation, Stage, StageDocument } from "./evaluation.model";
import mongoose from "mongoose";
import { Call } from "../call/call.model";
import { Directorate } from "../organization/organization.model";
import { ProjectStage } from "../project/stages/stage.model";

export interface GetEvalsOptions {
    type?: EvaluationType;
    parent?: mongoose.Types.ObjectId;
    directorate?: mongoose.Types.ObjectId;
}

export interface CreateEvaluationDto {
    type: EvaluationType;
    title: string;
    directorate?: mongoose.Types.ObjectId;
    parent?: mongoose.Types.ObjectId;
    order?: number;
    weight_value?: number;
    form_type?: FormType;
}


export class EvaluationService {

    private static async validateEvaluation(evl: Partial<CreateEvaluationDto>) {
        if (evl.type === EvaluationType.evaluation) {
            const directorate = await Directorate.findById(evl.directorate);
            if (!directorate) {
                throw new Error("Directorate Not Found!");
            }
        }
        else {
            if (evl.type === EvaluationType.stage) {
                const parent = await Evaluation.findById(evl.parent);
                if (!parent) {
                    throw new Error("Evaluation Not Found!");
                }
            }
            else if (evl.type === EvaluationType.criterion) {
                const parent = await Stage.findById(evl.parent);
                if (!parent) {
                    throw new Error("Stage Not Found!");
                }
            }
            else if (evl.type === EvaluationType.option) {
                if (evl.weight_value === undefined || evl.weight_value === null) {
                    throw new Error("Weight Value is Not Found");
                }
                const creterion = await Criterion.findById(evl.parent);
                if (!creterion) {
                    throw new Error("Criterion Not Found!");
                }
                if (evl.weight_value > creterion.weight_value) {
                    throw new Error(`Option value (${evl.weight_value}) must be less than or equal to the criterion weight (${creterion.weight_value}).`);
                }
            }
        }
    }

    static async createEvaluation(data: CreateEvaluationDto) {
        const { type, ...rest } = data;
        await this.validateEvaluation(data);
        if (!BaseEvaluation.discriminators || !BaseEvaluation.discriminators[type]) {
            throw new Error(`Invalid Evaluation type: ${type}`);
        }
        if (type === EvaluationType.stage) {
            const maxStage = await Stage.findOne({
                parent: data.parent
            })
                .sort({ order: -1 })
                .select('order')
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
        return await BaseEvaluation.find(filter).lean();
    }

    static async updateEvaluation(id: string, data: Partial<CreateEvaluationDto>) {
        const evaluation = await BaseEvaluation.findById(id);
        if (!evaluation) throw new Error("Evaluation not found");
        await this.validateEvaluation(data);
        //updation of creterion if there is options that greter than the weight value of the creterion 
        Object.assign(evaluation, data);
        return evaluation.save();
    }

    static async deleteEvaluation(id: string) {
        const evaluation = await BaseEvaluation.findById(id);
        if (!evaluation) throw new Error("Evaluation not found");
        if (evaluation.type !== EvaluationType.option) {
            const isParent = await BaseEvaluation.exists({ parent: evaluation._id });
            if (isParent) throw new Error(`Can not delete parent ${evaluation.type} ${evaluation.title}`);
        }
        if (evaluation.type === EvaluationType.evaluation) {
            const referencedByCall = await Call.exists({ evaluation: evaluation._id });
            if (referencedByCall) throw new Error(`Can not delete ${evaluation.title}, it is referenced in call.`);
        } else if (evaluation.type === EvaluationType.stage) {
            const referencedByProject = await ProjectStage.exists({ stage: evaluation._id });
            if (referencedByProject) throw new Error(`Can not delete ${evaluation.title}, it is referenced in projects.`);
            const stage = evaluation as unknown as StageDocument;
            const deleted = await evaluation.deleteOne();
            await Stage.updateMany({
                parent: stage.parent,
                order: { $gt: stage.order },
            },
                { $inc: { order: -1 } }
            );
            return deleted;
        }
        return await evaluation.deleteOne();
    }


    static async reorderStage(id: string, direction: string) {
        if (!['up', 'down'].includes(direction)) {
            throw new Error('Direction must be "up" or "down".');
        }
        const current = await Stage.findById(id).lean();
        if (!current) {
            throw new Error('Stage not found.');
        }

        const referencedByProject = await ProjectStage.exists({ stage: current._id });
        if (referencedByProject) throw new Error(`Can not reorder ${current.title}, it is used in projects.`);

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
