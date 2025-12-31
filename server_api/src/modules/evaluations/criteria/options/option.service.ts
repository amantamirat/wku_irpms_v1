import { DeleteDto } from "../../../../util/delete.dto";
import { FormType } from "../criterion.enum";
import { CriterionRepository, ICriterionRepository } from "../criterion.repository";
import {
    CreateOptionDTO,
    GetOptionsDTO,
    UpdateOptionDTO,
} from "./option.dto";
import { IOptionRepository, OptionRepository } from "./option.repository";

export class OptionService {

    private repository: IOptionRepository;
    private criterionRepo: ICriterionRepository;

    constructor(repository?: IOptionRepository, criterionRepo?: ICriterionRepository,) {
        this.repository = repository || new OptionRepository();
        this.criterionRepo = criterionRepo || new CriterionRepository();
    }
    /**
     * Create a new option under a criterion.
     */
    async create(dto: CreateOptionDTO) {
        const { criterion, title, score } = dto;

        const criterionDoc = await this.criterionRepo.findById(criterion);
        if (!criterionDoc) throw new Error("Criterion not found.");
        if (criterionDoc.formType !== FormType.closed) throw new Error("Criterion must be closed.");

        if (score > criterionDoc.weight) {
            throw new Error(
                `Option weight (${score}) exceeds its criterion limit (${criterionDoc.weight}).`
            );
        }
        return await this.repository.create(dto);
    }

    /**
     * Get all options under a given criterion.
     */
    async getOptions(dto: GetOptionsDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Update an existing option.
     */
    async update(dto: UpdateOptionDTO) {
        const { id, data } = dto;
        const option = await this.repository.findById(id);
        if (!option) throw new Error("Option not found.");

        if (data.score) {
            const criterion = await this.criterionRepo.findById(String(option.criterion));
            if (!criterion) throw new Error("Criterion not found.");
            if (data.score > criterion.weight) {
                throw new Error(
                    `Option weight (${data.score}) exceeds its criterion limit (${criterion.weight}).`
                );
            }
        }
        return this.repository.update(id, data);
    }

    /**
     * Delete an option by ID.
     */
    async delete(dto: DeleteDto) {
        const { id } = dto;
        return await this.repository.delete(id);
    }
}
