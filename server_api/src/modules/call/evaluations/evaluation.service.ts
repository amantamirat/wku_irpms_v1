import mongoose from "mongoose";
import { Directorate } from "../../organization/organization.model";
import { ProjectStage } from "../../project/stages/stage.model";
import { Call } from "../call.model";
import { EvaluationType, FormType } from "./evaluation.enum";
import { BaseEvaluation, Criterion, Evaluation, Option, Stage } from "./evaluation.model";
import { CacheService } from "../../../util/cache/cache.service";

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
    isValidation?: boolean;
}


export class EvaluationService {

    private static async validateEvaluationCreation(evl: Partial<CreateEvaluationDto>) {
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
                if (evl.isValidation) {
                    const isValidationExist = await Stage.exists({ parent: evl.parent, isValidation: true });
                    if (isValidationExist) throw new Error('Validation already created.');
                }
                const stageCount = await Stage.countDocuments({ parent: evl.parent });
                if (stageCount >= 10) {
                    throw new Error('Cannot create more than 10 stages per evaluation.');
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

    private static async validateEvaluationUpdation(evl: Partial<CreateEvaluationDto>, oldEvl: any) {
        if (oldEvl.type === EvaluationType.criterion) {
            if (evl.weight_value) {
                const options = await Option.find({ parent: oldEvl._id }).lean();
                for (const option of options) {
                    if (option.weight_value > evl.weight_value) {
                        throw new Error(`Option value (${option.weight_value}) is greater to the new criterion weight (${evl.weight_value}).`);
                    }
                }
            }
        }

        if (oldEvl.type === EvaluationType.option) {
            const creterion = oldEvl.parent;
            if (evl.weight_value) {
                if (evl.weight_value > creterion.weight_value) {
                    throw new Error(`Option value (${evl.weight_value}) must be less than or equal to the criterion weight (${creterion.weight_value}).`);
                }
            }
        }
    }

    static async createEvaluation(data: CreateEvaluationDto, userId: string) {
        const { type, ...rest } = data;
        if (data.directorate) {
            console.log("trying to create evaluation with", data.directorate);
            await CacheService.validateOwnership(userId, data.directorate);
        }
        await this.validateEvaluationCreation(data);
        if (type === EvaluationType.stage) {
            if (data.isValidation) {
                rest.order = 10;
            }
            else {
                const maxStage = await Stage.findOne({
                    parent: data.parent, isValidation: { $ne: true }
                })
                    .sort({ order: -1 })
                    .select('order')
                    .lean();
                rest.order = maxStage ? (maxStage.order ?? 0) + 1 : 1;
            }

        }
        const createdEvaluation = await BaseEvaluation.create({ type, ...rest });
        return createdEvaluation;
    }

    static async getEvaluations(options: GetEvalsOptions) {
        const filter: any = {};
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        if (options.directorate) filter.directorate = options.directorate;
        return await BaseEvaluation.find(filter).populate('directorate').lean();
    }

    static async getUserEvaluations(userId: string) {
        const orgs = await CacheService.getUserOrganizations(userId);
        if (!orgs.length) {
            return [];
        }
        const evals = await BaseEvaluation.find({ directorate: { $in: orgs } }).populate('directorate').lean();
        return evals;
    }

    static async updateEvaluation(id: string, data: Partial<CreateEvaluationDto>, userId: string) {
        const evaluation = await BaseEvaluation.findById(id).populate('parent') as any;
        if (!evaluation) throw new Error("Evaluation not found");
        if (evaluation.diectorate) {
            await CacheService.validateOwnership(userId, evaluation.directorate);
        }
        await this.validateEvaluationUpdation(data, evaluation);
        Object.assign(evaluation, data);
        return evaluation.save();
    }

    static async deleteEvaluation(id: string, userId: string) {
        const evaluation = await BaseEvaluation.findById(id);
        if (!evaluation) throw new Error("Evaluation not found");
        if (evaluation.type !== EvaluationType.option) {
            const isParent = await BaseEvaluation.exists({ parent: evaluation._id });
            if (isParent) throw new Error(`Can not delete parent ${evaluation.type} ${evaluation.title}`);
        }
        if (evaluation.type === EvaluationType.evaluation) {
            if ((evaluation as any).diectorate) {
                await CacheService.validateOwnership(userId, (evaluation as any).directorate);
            }
            const referencedByCall = await Call.exists({ evaluation: evaluation._id });
            if (referencedByCall) throw new Error(`Can not delete ${evaluation.title}, it is referenced in call.`);
        } else if (evaluation.type === EvaluationType.stage) {
            const referencedByProject = await ProjectStage.exists({ stage: evaluation._id });
            if (referencedByProject) throw new Error(`Can not delete ${evaluation.title}, it is referenced in projects.`);
            const stage = evaluation as any;
            const deleted = await evaluation.deleteOne();
            if (!stage.isValidation) {
                await Stage.updateMany({
                    parent: stage.parent,
                    order: { $gt: stage.order },
                },
                    { $inc: { order: -1 } }
                );
            }
            return deleted;
        }
        return await evaluation.deleteOne();
    }


    static async reorderStage(id: string, direction: string) {
        if (!['up', 'down'].includes(direction)) {
            throw new Error('Direction must be "up" or "down".');
        }
        const current = await Stage.findById(id).lean();
        if (!current || current.isValidation) throw new Error('Stage not found');

        const currentReferencedByProject = await ProjectStage.exists({ stage: current._id });
        if (currentReferencedByProject) throw new Error(`Can not reorder ${current.title}, it is used in projects.`);

        const order = current.order;
        if (typeof order !== 'number') {
            throw new Error('Current stage level is not defined.');
        }
        const target = await Stage.findOne({
            parent: current.parent,
            isValidation: { $ne: true },
            order: direction === 'up' ? order - 1 : order + 1
        });
        if (!target) {
            throw new Error(`Cannot move ${direction} any further.`);
        }

        const targetReferencedByProject = await ProjectStage.exists({ stage: target._id });
        if (targetReferencedByProject) throw new Error(`Can not reorder ${target.title}, it is used in projects.`);


        const currentLevel = current.order!;
        const targetLevel = target.order!;

        await Stage.updateOne(
            { _id: current._id },
            { $set: { order: -1 } },
            { runValidators: false } // Bypass min/max validation
        );
        // Swap stage levels using bulkWrite
        await Stage.updateOne(
            { _id: target._id },
            { $set: { order: currentLevel } }
        );
        // 3. Move current into target's position
        await Stage.updateOne(
            { _id: current._id },
            { $set: { order: targetLevel } }
        );
        return true;
    }





    /**
     * Batch import criteria (with optional options) under a given stage.
     * @param stageId - The parent stage ObjectId
     * @param criteriaData - Array of criteria objects, each may include options for closed form type
     * @returns Array of created criteria and their options
     */
    static async importCriteriaBatch(stageId: mongoose.Types.ObjectId, criteriaData: Array<{
        title: string;
        weight_value: number;
        form_type: FormType;
        options?: Array<{ title: string; weight_value: number }>;
    }>) {
        // Validate stage exists
        const stage = await Stage.findById(stageId);
        if (!stage) throw new Error('Stage not found');

        const createdCriteria = [];
        for (const criterion of criteriaData) {
            // Create criterion
            const criterionDoc = await Criterion.create({
                type: EvaluationType.criterion,
                title: criterion.title,
                parent: stageId,
                weight_value: criterion.weight_value,
                form_type: criterion.form_type
            });

            let createdOptions = [];
            // If closed form, create options if provided
            if (criterion.form_type === FormType.closed && Array.isArray(criterion.options)) {
                for (const option of criterion.options) {
                    // Only create option if weight_value is valid
                    if (option.weight_value > criterion.weight_value) {
                        //throw new Error(`Option value (${option.weight_value}) must be less than or equal to the criterion weight (${criterion.weight_value}).`);
                        continue;
                    }
                    const optionDoc = await Option.create({
                        type: EvaluationType.option,
                        title: option.title,
                        parent: criterionDoc._id,
                        weight_value: option.weight_value
                    });
                    createdOptions.push(optionDoc);
                }
            }
            createdCriteria.push({ criterion: criterionDoc, options: createdOptions });
        }
        return createdCriteria;
    }
}
