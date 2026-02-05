import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { GrantRepository, IGrantRepository } from "../grant.repository";
import { CreateConstraintDTO, GetConstraintOptions, UpdateConstraintDTO } from "./constraint.dto";
import { ConstraintType } from "./constraint.model";
import { CompositionRepository, ICompositionRepository } from "./compositions/composition.repository";


export class ConstraintService {

    constructor(
        private readonly repository: IConstraintRepository = new ConstraintRepository(),
        private readonly grantRepository: IGrantRepository = new GrantRepository(),
        private readonly compositionRepo: ICompositionRepository = new CompositionRepository(),
    ) { }

    async create(dto: CreateConstraintDTO) {
        const { grant, type, constraint } = dto;
        const grantDoc = await this.grantRepository.findById(grant);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.CONSTRAINT_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    //----------------------------------------
    // GET
    //----------------------------------------
    async getConstraints(options: GetConstraintOptions) {
        return await this.repository.find(options);
    }


    async update(dto: UpdateConstraintDTO) {
        const { id } = dto;
        const constraint = await this.repository.findById(id);
        if (!constraint || constraint.type !== ConstraintType.PROJECT) throw new AppError(ERROR_CODES.CONSTRAINT_NOT_FOUND);
        return await this.repository.update(dto);
    }

    //----------------------------------------
    // DELETE
    //----------------------------------------
    async delete(id: string) {
        const compositionExist = await this.compositionRepo.exists(id);
        if (compositionExist)
            throw new AppError(ERROR_CODES.COMPOSITION_ALREADY_EXISTS);

        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.CONSTRAINT_NOT_FOUND);
    }
}
