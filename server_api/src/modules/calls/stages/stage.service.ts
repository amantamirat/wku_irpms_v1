import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { IDocumentRepository } from "../../projects/documents/document.repository";
import { ICallRepository } from "../call.repository";
import { CallStatus } from "../call.status";
import { CreateStageDTO, GetStageDTO, UpdateStageDTO, UpdateStageStatusDTO } from "./stage.dto";
import { IStageRepository } from "./stage.repository";
import { StageStateMachine } from "./stage.state-machine";
import { StageStatus } from "./stage.status";

export class StageService {

    constructor(
        private readonly repository: IStageRepository,
        private readonly callRepository: ICallRepository,
        private readonly evalRepository: IEvaluationRepository,
        private readonly docRepository: IDocumentRepository,
    ) {
        this.repository = repository;
        this.callRepository = callRepository;
        this.evalRepository = evalRepository;
        this.docRepository = docRepository;
    }
    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const { call, evaluation } = dto;

        const callDoc = await this.callRepository.findById(call);
        if (!callDoc) throw new Error(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new Error(ERROR_CODES.CALL_NOT_ACTIVE);

        const evalDoc = await this.evalRepository.findById(evaluation);
        if (!evalDoc) throw new Error(ERROR_CODES.EVALUATION_NOT_FOUND);

        const stages = await this.repository.find({ call });
        const nextOrder = stages.length + 1;
        const stage = await this.repository.create({ ...dto, order: nextOrder, status: StageStatus.planned });
        return stage;
    }
    /**
     * Get all stages or by call
     */
    async getStages(dto: GetStageDTO) {
        return await this.repository.find({ ...dto, populate: true });
    }
    /**
     * Update a stage
     */
    async update(dto: UpdateStageDTO) {
        const { id, data } = dto;
        const stage = await this.repository.update(id, data);
        if (!stage) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        return stage;
    }
    /**
    * Update Status
    */
    async updateStatus(dto: UpdateStageStatusDTO) {
        const { id, status } = dto;
        const nextState = status;
        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        const current = stageDoc.status;

        // --- State Machine Validation ---
        StageStateMachine.validateTransition(current, nextState);
        if (nextState === StageStatus.planned) {
            const documents = await this.docRepository.find({ stage: id });
            if (documents.length > 0) {
                throw new AppError(ERROR_CODES.STAGE_DOCUMENT_ALREADY_EXISTS);
            }
        }

        const updated = await this.repository.update(dto.id, { status: nextState });
        return updated;
    }
    /**
     * Delete a stage
    */
    async delete(id: string) {
        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        if (stageDoc.status !== StageStatus.planned) throw new Error(ERROR_CODES.STAGE_NOT_PLANNED);

        const { call, order } = stageDoc;
        const deleted = await this.repository.delete(id);
        // Re-arrange orders of remaining stages
        if (deleted) {
            await this.repository.updateMany(
                {
                    call,
                    order: { $gt: order }
                },
                {
                    $inc: { order: -1 }
                }
            );
        }
        return deleted
    }
}
