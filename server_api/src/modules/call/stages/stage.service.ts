import mongoose from "mongoose";
import { Evaluation } from "../../evaluations/evaluation.model";
import { CreateStageDTO, GetStagesDTO, UpdateStageDTO } from "./stage.dto";
import { StageStatus } from "./stage.enum";
import { Stage } from "./stage.model";

export class StageService {

    /**
     * Create a new stage
     */
    static async createStage(dto: CreateStageDTO) {
        const { call, name, type, evaluation, deadline } = dto;

        // Validate evaluation existence
        const evalDoc = await Evaluation.findById(evaluation);
        if (!evalDoc) throw new Error("Evaluation not found.");

        // Find the latest stage order for this call
        const lastStage = await Stage.findOne({ call })
            .sort({ order: -1 })
            .select("order");

        const nextOrder = lastStage ? lastStage.order + 1 : 1;

        // Create stage
        const stage = await Stage.create({
            call,
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
        if (dto.call) filter.call = dto.call;

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

        // Optional restriction: only delete planned stages
        if (stage.status !== StageStatus.planned)
            throw new Error("Only planned stages can be deleted.");

        const deleted = await stage.deleteOne();
        await StageService.resequenceStages(stage.call);
        return deleted;
    }

    static async resequenceStages(callId: string | mongoose.Types.ObjectId) {
        const stages = await Stage.find({ call: callId }).sort({ order: 1 });
        for (let i = 0; i < stages.length; i++) {
            stages[i].order = i + 1;
            await stages[i].save();
        }
    }
}
