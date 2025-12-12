import { Evaluation } from "../../evaluations/evaluation.model";
import { CreateStageDTO, GetStagesDTO, UpdateStageDTO } from "./stage.dto";
import { StageStatus } from "./stage.enum";
import { IStageRepository, StageRepository } from "./stage.repository";

export class StageService {

    private repository: IStageRepository;

    constructor(repository?: IStageRepository) {
        this.repository = repository || new StageRepository();
    }
    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const { call, name, evaluation, deadline } = dto;

        // Validate evaluation existence
        const evalDoc = await Evaluation.findById(evaluation);
        if (!evalDoc) throw new Error("Evaluation not found.");


        // If adding an evaluation, no validation should exist before it
        /*
        if (type === StageType.evaluation) {
            const validationStages = await this.repository.find({ cycle, type: StageType.validation });
            if (validationStages.length > 0) {
                throw new Error("Cannot add an evaluation stage after a validation stage already exists.");
            }
        }
            */

        // Find the latest stage order for this call
        const lastStage = await this.repository.findLastStageByCycle({ call: call });

        const nextOrder = lastStage ? lastStage.order + 1 : 1;

        console.log(nextOrder)

        /*
        if (nextOrder === 1 && type === StageType.validation) {
            throw new Error("The first stage cannot be validation.");
        }
            */

        // Create stage
        const stage = await this.repository.create({ ...dto, order: nextOrder, status: StageStatus.planned });

        return stage;
    }

    /**
     * Get all stages or by call
     */
    async getStages(dto: GetStagesDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Update a stage
     */
    async updateStage(dto: UpdateStageDTO) {
        const { id, data } = dto;

        const stage = await this.repository.findById(id);
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
        //Object.assign(stage, data);
        return await this.repository.update(id, data);
    }

    /**
     * Delete a stage
     */
    async deleteStage(id: string) {
        const stage = await this.repository.findById(id);
        if (!stage) throw new Error("Stage not found");

        // Rule 1: Only planned (pending) stages can be deleted
        if (stage.status !== StageStatus.planned) {
            throw new Error("Only planned stages can be deleted.");
        }

        // Rule 2: Only the last stage can be deleted
        const lastStage = await this.repository.findLastStageByCycle({ call: stage.call.toString() });

        if (!lastStage || lastStage._id.toString() !== id) {
            throw new Error("Only the last stage can be deleted.");
        }

        // Proceed with deletion
        const deleted = await this.repository.delete(id); //stage.deleteOne();
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
