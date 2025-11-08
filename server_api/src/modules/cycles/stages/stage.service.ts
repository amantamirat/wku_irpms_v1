import { Evaluation } from "../../evaluations/evaluation.model";
import { CreateStageDTO, GetStagesDTO, UpdateStageDTO } from "./stage.dto";
import { StageStatus, StageType } from "./stage.enum";
import { Stage } from "./stage.model";

export class StageService {

    /**
     * Create a new stage
     */
    static async createStage(dto: CreateStageDTO) {
        const { cycle, name, type, evaluation, deadline } = dto;

        // Validate evaluation existence
        const evalDoc = await Evaluation.findById(evaluation);
        if (!evalDoc) throw new Error("Evaluation not found.");


          // If adding an evaluation, no validation should exist before it
        if (type === StageType.evaluation) {
            const validationBefore = await Stage.findOne({
                cycle: cycle,
                type: StageType.validation,
            });
            if (validationBefore) {
                throw new Error("Cannot add an evaluation stage after a validation stage already exists.");
            }
        }

        // Find the latest stage order for this call
        const lastStage = await Stage.findOne({ cycle: cycle })
            .sort({ order: -1 })
            .select("order");

        const nextOrder = lastStage ? lastStage.order + 1 : 1;

        if (nextOrder === 1 && type === StageType.validation) {
            throw new Error("The first stage cannot be validation.");
        }      

        // Create stage
        const stage = await Stage.create({
            cycle: cycle,
            name,
            type,
            evaluation,
            deadline,
            order: nextOrder,
            status: StageStatus.planned,
        });

        return stage;
    }

    /**
     * Get all stages or by call
     */
    static async getStages(dto: GetStagesDTO) {
        const filter: any = {};
        if (dto.cycle) filter.call = dto.cycle;
        if (dto.order) filter.order = dto.order;
        if (dto.status) filter.status = dto.status;

        return await Stage.find(filter)
            .populate("evaluation")
            .sort({ order: 1 })
            .lean();
    }

    /**
     * Update a stage
     */
    static async updateStage(dto: UpdateStageDTO) {
        const { id, data } = dto;

        const stage = await Stage.findById(id);
        if (!stage) throw new Error("Stage not found");

        /*
        const activeStage = await Stage.findOne({
            call: stage.call,
            status: StageStatus.active,
            _id: { $ne: stage._id } // exclude current stage
        });
        if (activeStage) {
            throw new Error("Only one active stage is allowed per call.");
        }

        // rule 2: Check previous stages are validated before activating this one
        const previousStage = await Stage.findOne({
            call: stage.call,
            order: { $lt: stage.order },
            status: { $ne: StageStatus.closed }
        });
        if (previousStage) {
            throw new Error("Cannot activate this stage before all previous stages are closed.");
        }

        */

        //only one active stage should be there
        Object.assign(stage, data);
        return stage.save();
    }

    /**
     * Delete a stage
     */
    static async deleteStage(id: string) {
        const stage = await Stage.findById(id);
        if (!stage) throw new Error("Stage not found");

        // Rule 1: Only planned (pending) stages can be deleted
        if (stage.status !== StageStatus.planned) {
            throw new Error("Only planned stages can be deleted.");
        }

        // Rule 2: Only the last stage can be deleted
        const lastStage = await Stage.findOne({ cycle: stage.cycle })
            .sort({ order: -1 })
            .select("order");

        if (!lastStage || lastStage._id.toString() !== stage._id.toString()) {
            throw new Error("Only the last stage can be deleted.");
        }

        // Proceed with deletion
        const deleted = await stage.deleteOne();
        return deleted;
    }


    /*
    static async resequenceStages(callId: string | mongoose.Types.ObjectId) {
        const stages = await Stage.find({ call: callId }).sort({ order: 1 });
        for (let i = 0; i < stages.length; i++) {
            stages[i].order = i + 1;
            await stages[i].save();
        }
    }
    */
}
