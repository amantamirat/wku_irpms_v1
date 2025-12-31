import { CacheService } from "../../util/cache/cache.service";
import { DeleteDto } from "../../util/delete.dto";
import { Directorate } from "../organization/organization.model";
import { CreateEvaluationDTO, GetEvaluationsDTO, UpdateEvaluationDTO } from "./evaluation.dto";
import { EvaluationRepository, IEvaluationRepository } from "./evaluation.repository";

export class EvaluationService {

    private repository: IEvaluationRepository;

    constructor(repository?: IEvaluationRepository) {
        this.repository = repository || new EvaluationRepository();
    }

    async create(dto: CreateEvaluationDTO) {
        //await CacheService.validateOwnership(dto.userId, dto.directorate);

        const directorateDoc = await Directorate.findById(dto.directorate).lean();
        if (!directorateDoc) {
            throw new Error("Directorate not found");
        }
        const createdEvaluation = await this.repository.create(dto);
        return createdEvaluation;
    }

    async getEvaluations(options: GetEvaluationsDTO) {
        return await this.repository.find(options);
    }

    
    async update(dto: UpdateEvaluationDTO) {
        const { id, data, userId } = dto;
        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) throw new Error("Evaluation not found");

        //await CacheService.validateOwnership(userId, evalDoc.directorate);

        return await this.repository.update(id, data);
    }

    async delete(dto: DeleteDto) {
        const { id, userId } = dto;
        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) throw new Error("Evaluation not found");

        //await CacheService.validateOwnership(userId, evalDoc.directorate);

        /*
        const countCriteria = await this.repository.countCriteria(id);
        if (countCriteria > 0) {
            throw new Error("Cannot delete evaluation with existing criteria.");
        }
*/
        return await this.repository.delete(id);
    }
}
