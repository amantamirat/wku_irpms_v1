import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { GrantRepository, IGrantRepository } from "../grant.repository";
import { CreateConstraintDTO, GetConstraintOptions, UpdateConstraintDTO } from "./constraint.dto";
import { ConstraintType } from "./constraint.model";


export class ConstraintService {

    constructor(
        private readonly repository: IConstraintRepository = new ConstraintRepository(),
        private readonly grantRepository: IGrantRepository = new GrantRepository(),
    ) { }

    async create(dto: CreateConstraintDTO) {
        const { grant, type, constraint } = dto;
        const grantDoc = await this.grantRepository.findById(grant);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        return await this.repository.create(dto);
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
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.CONSTRAINT_NOT_FOUND);
    }
}
