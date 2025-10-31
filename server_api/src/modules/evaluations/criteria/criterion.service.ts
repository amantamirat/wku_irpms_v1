import { Evaluation } from "../evaluation.model";
import { Option } from "../options/option.model";
import {
    CreateCriterionDTO,
    DeleteCriterionDTO,
    GetCriteriaDTO,
    ImportCriteriaBatchDTO,
    UpdateCriterionDTO,
} from "./criterion.dto";
import { FormType } from "./criterion.enum";
import { Criterion } from "./criterion.model";

export class CriterionService {
    /**
     * Create a single criterion.
     */
    static async createCriterion(dto: CreateCriterionDTO) {
        const evalDoc = await Evaluation.findById(dto.evaluation);
        if (!evalDoc) throw new Error("Evaluation not found.");

        return await Criterion.create(dto);
    }

    /**
     * Get all criteria for an evaluation.
     */
    static async getCriteria(dto: GetCriteriaDTO) {
        const { evaluation } = dto;
        return await Criterion.find({ evaluation: evaluation })
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * Update an existing criterion.
     */
    static async updateCriterion(dto: UpdateCriterionDTO) {
        const { id, data } = dto;

        const criterion = await Criterion.findById(id);
        if (!criterion) throw new Error("Criterion not found.");

        // Validate weight change against existing options
        if (data.weight !== undefined) {
            const options = await Option.find({ criterion: id }).lean();
            for (const opt of options) {
                if (opt.value > data.weight) {
                    throw new Error(
                        `Option value (${opt.value}) exceeds new criterion weight (${data.weight}).`
                    );
                }
            }
        }

        Object.assign(criterion, data);
        return criterion.save();
    }

    /**
     * Delete a criterion only if no options exist.
     */
    static async deleteCriterion(dto: DeleteCriterionDTO) {
        const { id } = dto;

        const optionCount = await Option.countDocuments({ criterion: id });
        if (optionCount > 0)
            throw new Error("Cannot delete criterion with existing options.");

        return await Criterion.findByIdAndDelete(id);
    }

    /**
     * Batch import criteria (with optional options) under a given evaluation.
     */
    static async importCriteriaBatch(dto: ImportCriteriaBatchDTO) {
        const { evaluation, criteriaData } = dto;

        // 1️⃣ Validate evaluation exists
        const _evaluation = await Evaluation.findById(evaluation);
        if (!_evaluation) throw new Error("Evaluation not found.");

        const createdResults = [];

        // 2️⃣ Create criteria and options in sequence
        for (const criterion of criteriaData) {
            // Create criterion
            const criterionDoc = await Criterion.create({
                evaluation: evaluation,
                title: criterion.title,
                weight: criterion.weight,
                form_type: criterion.form_type,
            });

            let createdOptions = [];

            // If closed form, process options
            if (criterion.form_type === FormType.closed && Array.isArray(criterion.options)) {
                for (const opt of criterion.options) {
                    if (opt.value > criterion.weight) continue; // skip invalid option

                    const optionDoc = await Option.create({
                        criterion: criterionDoc._id,
                        title: opt.title,
                        value: opt.value,
                    });

                    createdOptions.push(optionDoc);
                }
            }

            createdResults.push({ criterion: criterionDoc, options: createdOptions });
        }

        return createdResults;
    }
}
