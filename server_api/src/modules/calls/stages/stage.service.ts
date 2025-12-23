import { EvaluationRepository, IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { CallStatus } from "../call.status";
import { CallRepository, ICallRepository } from "../call.repository";
import { DocumentRepository, IDocumentRepository } from "./documents/document.repository";
import { CreateStageDTO, FilterStageDTO, UpdateStageDTO } from "./stage.dto";
import { StageStatus } from "./stage.status";
import { IStageRepository, StageRepository } from "./stage.repository";
import { StageStateMachine } from "./stage.state-machine";

export class StageService {

    private repository: IStageRepository;
    private callRepository: ICallRepository;
    private evalRepository: IEvaluationRepository;
    private documentRepo: IDocumentRepository;

    constructor(repository?: IStageRepository, callRepository?: ICallRepository,
        evalRepository?: IEvaluationRepository, documentRepo?: IDocumentRepository) {
        this.repository = repository || new StageRepository();
        this.callRepository = callRepository || new CallRepository();
        this.evalRepository = evalRepository || new EvaluationRepository();
        this.documentRepo = documentRepo || new DocumentRepository();
    }
    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const { call, evaluation } = dto;

        const callDoc = await this.callRepository.findById(call);
        if (!callDoc) throw new Error("Call not found.");
        if (callDoc.status !== CallStatus.active) throw new Error("Call is not active.");

        const evalDoc = await this.evalRepository.findById(evaluation);
        if (!evalDoc) throw new Error("Evaluation not found.");

        const lastDoc = await this.repository.findLastStageByCall(call);
        if (!lastDoc) throw new Error("Last stage doc not found.");
        if (lastDoc.isFinal === true) throw new Error("Final stage already exists.");

        const nextOrder = lastDoc?.order ? lastDoc.order + 1 : 1;
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
        if (data.isFinal === true) {
            const stageDoc = await this.repository.findOne({ _id: id });
            if (!stageDoc) throw new Error("Stage not found.");
            const lastStageDoc = await this.repository.findLastStageByCall(String(stageDoc.call));
            if (!lastStageDoc) throw new Error("Last stage not found.");
            if (String(lastStageDoc._id) !== id) throw new Error("Only last stage can be final.");
        }
        const stage = await this.repository.update(id, data);
        if (!stage) throw new Error("Stage not found");
        return
    }
    /**
    * Update Status
    */
    async updateStatus(dto: UpdateStageDTO) {
        const { id, data } = dto;
        const nextState = data.status;
        if (!nextState) throw new Error("Status not found");
        const stageDoc = await this.repository.findOne({ _id: id });
        if (!stageDoc) throw new Error("Stage not found");
        const current = stageDoc.status;
        // --- State Machine Validation ---
        StageStateMachine.validateTransition(current, nextState);
        if (nextState === StageStatus.planned) {
            const documents = await this.documentRepo.find({ stage: id }, false);
            if (documents.length > 0) {
                throw new Error("Can not change to planned, document already exist!");
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
        if (!lastDoc) throw new Error("Last stage is not found");
        if (lastDoc.order !== stageDoc.order) {
            throw new Error("Only the last stage can be deleted.");
        }
        // Proceed with deletion
        const deleted = await this.repository.delete(id); //stage.deleteOne();
        return deleted;
    }
}
