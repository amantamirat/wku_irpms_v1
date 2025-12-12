import { Stage } from "../../calls/stages/stage.model";
import { Evaluation } from "../evaluation.model";
import { Option } from "./options/option.model";
import {
    CreateCriterionDTO,
    DeleteCriterionDTO,
    GetCriteriaDTO,
    ImportCriteriaBatchDTO,
    UpdateCriterionDTO,
} from "./criterion.dto";
import { FormType } from "./criterion.enum";
import { Criterion } from "./criterion.model";
import { Reviewer } from "../../calls/stages/projects/reviewers/reviewer.model";
import mongoose from "mongoose";
import { COLLECTIONS } from "../../../util/collections.enum";
import { CriterionRepository, ICriterionRepository } from "./criterion.repository";
import { EvaluationRepository, IEvaluationRepository } from "../evaluation.repository";

export class CriterionService {

    private repository: ICriterionRepository;
    private evalRepository: IEvaluationRepository;

    constructor(repository?: ICriterionRepository, evalRepository?: IEvaluationRepository,) {
        this.repository = repository || new CriterionRepository();
        this.evalRepository = evalRepository || new EvaluationRepository();
    }
    /**
     * Create a single criterion.
     */
    async create(dto: CreateCriterionDTO) {
        const evalDoc = await this.evalRepository.findById(dto.evaluation);
        if (!evalDoc) throw new Error("Evaluation not found.");
        return await this.repository.create(dto);
    }

    async get(dto: GetCriteriaDTO) {
        const { evaluation } = dto;
        return await this.repository.find({ evaluation });
    }

    /**
     * Update an existing criterion.
     */
    async update(dto: UpdateCriterionDTO) {
        const { id, data } = dto;

        //const criterion = await Criterion.findById(id);
        //if (!criterion) throw new Error("Criterion not found.");

        // Validate weight change against existing options
        if (data.weight) {
            const options = await Option.find({ criterion: id }).lean();
            for (const opt of options) {
                if (opt.score > data.weight) {
                    throw new Error(
                        `Option value (${opt.score}) exceeds new criterion weight (${data.weight}).`
                    );
                }
            }
        }
        return this.repository.update(id, data);
    }

    /**
    * Delete a criterion only if no options exist.
    */
    async delete(dto: DeleteCriterionDTO) {
        const { id } = dto;
        /*
        const optionCount = await Option.countDocuments({ criterion: id });
        if (optionCount > 0)
            throw new Error("Cannot delete criterion with existing options.");
        */
        return await this.repository.delete(id);
    }



    /**
     * Get all criteria for an evaluation.
     */
    static async getCriteria(dto: GetCriteriaDTO) {
        const { evaluation, stage, reviewer } = dto;
        if (reviewer) {
            return await this.getCriteriaByReviewer(reviewer);
        }

        // Determine the correct evaluation ID to use
        let stageEvaluation = evaluation;

        if (!stageEvaluation && stage) {
            const stageDoc = await Stage.findById(stage).select("evaluation");
            if (!stageDoc) {
                throw new Error("Stage not found.");
            }
            //stageEvaluation = stageDoc.evaluation;
            //stageEvaluation = "";
        }

        if (!stageEvaluation) {
            throw new Error("Evaluation ID is required.");
        }

        return await Criterion.find({ evaluation: stageEvaluation })
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * Get all criteria for a given reviewer (via reviewer → projectStage → stage → evaluation).
     */
    static async getCriteriaByReviewer(reviewerId: string) {
        const criteria = await Reviewer.aggregate([
            // 1️⃣ Match the reviewer
            { $match: { _id: new mongoose.Types.ObjectId(reviewerId) } },

            // 2️⃣ Lookup projectStage
            {
                $lookup: {
                    from: "projectstages",      // MongoDB collection name for ProjectStage
                    localField: "projectStage",
                    foreignField: "_id",
                    as: "projectStage"
                }
            },
            { $unwind: "$projectStage" },

            // 3️⃣ Lookup stage
            {
                $lookup: {
                    from: "stages",            // MongoDB collection name for Stage
                    localField: "projectStage.stage",
                    foreignField: "_id",
                    as: "stage"
                }
            },
            { $unwind: "$stage" },

            // 4️⃣ Lookup criteria (linked to evaluation)
            {
                $lookup: {
                    from: COLLECTIONS.CRITERION,          // MongoDB collection name for Criterion
                    localField: "stage.evaluation",
                    foreignField: "evaluation",
                    as: "criteria"
                }
            },

            // 5️⃣ Unwind criteria array so each criterion is a separate document
            { $unwind: "$criteria" },

            // 6️⃣ Replace root so we only return the criteria
            { $replaceRoot: { newRoot: "$criteria" } },

            // 7️⃣ Sort by creation date (descending)
            { $sort: { createdAt: -1 } }
        ]);

        return criteria;
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
                    if (opt.score > criterion.weight) continue; // skip invalid option

                    const optionDoc = await Option.create({
                        criterion: criterionDoc._id,
                        title: opt.title,
                        score: opt.score,
                    });

                    createdOptions.push(optionDoc);
                }
            }

            createdResults.push({ criterion: criterionDoc, options: createdOptions });
        }

        return createdResults;
    }
}
