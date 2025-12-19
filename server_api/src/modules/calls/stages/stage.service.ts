import { EvaluationRepository, IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { CallStatus } from "../call.enum";
import { CallRepository, ICallRepository } from "../call.repository";
import { CreateStageDTO, FilterStageDTO, UpdateStageDTO } from "./stage.dto";
import { StageStatus } from "./stage.enum";
import { IStageRepository, StageRepository } from "./stage.repository";
import { StageStateMachine } from "./stage.state-machine";

export class StageService {

    private repository: IStageRepository;
    private callRepository: ICallRepository;
    private evalRepository: IEvaluationRepository;

    constructor(repository?: IStageRepository, callRepository?: ICallRepository,
        evalRepository?: IEvaluationRepository) {

        this.repository = repository || new StageRepository();
        this.callRepository = callRepository || new CallRepository();
        this.evalRepository = evalRepository || new EvaluationRepository();
    }
    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const { call, evaluation } = dto;
        // Validate call existence and activatation
        const callDoc = await this.callRepository.findById(call);
        if (!callDoc) throw new Error("Evaluation not found.");
        if (callDoc.status !== CallStatus.active) throw new Error("Call is not active.");
        // Validate evaluation existence
        const evalDoc = await this.evalRepository.findById(evaluation);
        if (!evalDoc) throw new Error("Evaluation not found.");
        //Last doc
        const lastDoc = await this.repository.findLastStageByCall(call);
        const nextOrder = lastDoc?.order ?? 0 + 1;
        const stage = await this.repository.create({ ...dto, order: nextOrder, status: StageStatus.planned });
        return stage;
    }
    /**
     * Get all stages or by call
     */
    async getStages(dto: FilterStageDTO) {
        return await this.repository.find(dto);
    }
    /**
     * Update a stage
     */
    async update(dto: UpdateStageDTO) {
        const { id, data } = dto;
        delete data.status
        const stage = await this.repository.update(id, data);
        if (!stage) throw new Error("Stage not found");
        return
    }
    /**
    * Change Status
    */
    async changeStatus(dto: UpdateStageDTO) {
        const { id, data } = dto;
        const nextState = data.status;
        if (!nextState) throw new Error("Status not found");
        const stageDoc = await this.repository.findOne({ _id: id });
        if (!stageDoc) throw new Error("Stage not found");
        const current = stageDoc.status;
        // --- State Machine Validation ---
        StageStateMachine.validateTransition(current, nextState);
        if (nextState === StageStatus.planned) {
            const stages = await this.repository.find({ call: String(stageDoc.call) }, false);
            if (stages.length > 0) {
                throw new Error("Can not change the call to planned, stages already exist!");
            }
        }
        const updated = await this.repository.update(dto.id, { status: nextState });
        return updated;
    }
    /**
     * Delete a stage
    */
    async delete(id: string, callId?: string) {
        //before all of just accept the call Id then find the last and delete it, if it is planned.
        const stageDoc = await this.repository.findOne({ _id: id });
        if (!stageDoc) throw new Error("Stage not found");
        // Rule 1: Only planned (pending) stages can be deleted
        if (stageDoc.status !== StageStatus.planned) {
            throw new Error("Only planned stages can be deleted.");
        }
        //Rule 2 Only last stage can be Deleted
        const lastDoc = await this.repository.findLastStageByCall(String(stageDoc.call));
        if (lastDoc?.order !== stageDoc.order) {
            throw new Error("Only the last stage can be deleted.");
        }
        // Proceed with deletion
        const deleted = await this.repository.delete(id); //stage.deleteOne();
        return deleted;
    }
}
