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

        // Create stage
        const stage = await Stage.create({
            call,
            name,
            type,
            evaluation,
            deadline,
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
            .sort({ createdAt: -1 })
            .lean();
    }

    /**
     * Update a stage
     */
    static async updateStage(dto: UpdateStageDTO) {
        const { id, data } = dto;

        const stage = await Stage.findById(id);
        if (!stage) throw new Error("Stage not found");

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

        return await stage.deleteOne();
    }
}
