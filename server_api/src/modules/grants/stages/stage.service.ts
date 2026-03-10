import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { EvaluationRepository, IEvaluationRepository } from "../../evaluations/evaluation.repository";
import { GrantRepository, IGrantRepository } from "../grant.repository";
import { CreateStageDTO, GetStageDTO, UpdateStageDTO } from "./stage.dto";
import { IStageRepository, StageRepository } from "./stage.repository";

export class StageService {

    constructor(
        private readonly repository: IStageRepository = new StageRepository(),
        private readonly grantRepository: IGrantRepository = new GrantRepository(),        
        private readonly evalRepository: IEvaluationRepository = new EvaluationRepository(),
    ) {

    }
    /**
     * Create a new stage
     */
    async create(dto: CreateStageDTO) {
        const { grant, evaluation } = dto;

        const grantDoc = await this.grantRepository.findById(grant);
        if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);


        const evalDoc = await this.evalRepository.findById(evaluation);
        if (!evalDoc) throw new Error(ERROR_CODES.EVALUATION_NOT_FOUND);

        const stages = await this.repository.find({ grant });
        const nextOrder = stages.length + 1;
        const stage = await this.repository.create({ ...dto, order: nextOrder });
        return stage;
    }
    /**
     * Get all stages or by call
     */
    async getStages(dto: GetStageDTO) {
        return await this.repository.find({ ...dto, populate: true });
    }

    async getById(id: string) {
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        return stage;
    }
    /**
     * Update a stage
     */
    async update(dto: UpdateStageDTO) {
        const { id, data } = dto;
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        return await this.repository.update(id, data);
    }
    
    /**
     * Delete a stage
    */
    async delete(id: string) {
        const stageDoc = await this.repository.findById(id);
        if (!stageDoc) throw new Error(ERROR_CODES.STAGE_NOT_FOUND);        

        const { grant, order } = stageDoc;
        const deleted = await this.repository.delete(id);
        // Re-arrange orders of remaining stages
        if (deleted) {
            await this.repository.updateMany(
                {
                    grant,
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
