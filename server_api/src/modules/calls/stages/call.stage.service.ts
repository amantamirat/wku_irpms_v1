import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { IGrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { IDocumentRepository } from "../../projects/documents/document.repository";
import { ICallRepository } from "../call.repository";
import { CALL_TRANSITIONS } from "../call.state-machine";
import { CallStatus } from "../call.status";
import { CreateStageDTO, GetStageDTO, UpdateStageDTO } from "./call.stage.dto";
import { ICallStageRepository } from "./call.stage.repository";
import { STAGE_TRANSITIONS } from "./call.stage.state-machine";
import { CallStageStatus } from "./call.stage.model";

export class StageService {

    constructor(
        private readonly repository: ICallStageRepository,
        private readonly callRepo: ICallRepository,
        private readonly grantStageRepo: IGrantStageRepository,
    ) {

    }
    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const { call, grantStage } = dto;

        const callDoc = await this.callRepo.findById(call);
        if (!callDoc) throw new Error(ERROR_CODES.CALL_NOT_FOUND);

        const stageDoc = await this.grantStageRepo.findById(grantStage);
        if (!stageDoc) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);
            }
            throw err;
        }
    }
    /**
     * Get all stages or by call
     */
    async getStages(dto: GetStageDTO) {
        return await this.repository.find({ ...dto, populate: true });
    }

    async getById(id: string) {
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
        return stage;
    }
    /**
     * Update a stage
     */
    async update(dto: UpdateStageDTO) {
        const { id, data } = dto;
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        if (stage.status === CallStageStatus.closed)
            new AppError(ERROR_CODES.STAGE_ALREADY_CLOSED);
        return await this.repository.update(id, data);
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) {
            throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);
        }
        const from = stageDoc.status as CallStageStatus;
        const to = next as CallStageStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }
        TransitionHelper.validateTransition(
            from,
            to,
            STAGE_TRANSITIONS
        );

        if (next === CallStatus.planned) {

        }

        return await this.repository.update(id, {
            status: to
        });
    }
    /**
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
    */

    /**
     * Delete a stage
    */
    async delete(id: string) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        /*
        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);
        if (stageDoc.status !== CallStageStatus.planned) throw new Error(ERROR_CODES.STAGE_NOT_PLANNED);
        const deleted = await this.repository.delete(id);
        return deleted
        */
    }
}
