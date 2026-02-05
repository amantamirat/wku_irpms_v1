import { CompositionRepository, ICompositionRepository } from "./composition.repository";
import { IApplicantConstraint } from "../applicant/applicant-constraint.model";
import { isRangeConstraint, isListConstraint, ApplicantConstraintType, getListOptions } from "../applicant/applicant-constaint-type";
import { CreateCompositionDTO, GetCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { ConstraintRepository, IConstraintRepository } from "../constraint.repository";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { ConstraintType } from "../constraint.model";
import { AppError } from "../../../../common/errors/app.error";


export class CompositionService {

    constructor(
        private readonly repository: ICompositionRepository = new CompositionRepository(),
        private readonly constraintRepo: IConstraintRepository = new ConstraintRepository(),
    ) { }


    //----------------------------------------
    // VALIDATION
    //----------------------------------------
    private async validate(dto: CreateCompositionDTO) {

        const {constraint,  min, max } = dto;

        const constraintDoc = await this.constraintRepo.findById(constraint) as IApplicantConstraint;
        if (!constraintDoc || constraintDoc.type !== ConstraintType.APPLICANT) throw new Error(ERROR_CODES.CONSTRAINT_NOT_FOUND);

        const applicantType = constraintDoc.constraint as ApplicantConstraintType;

        if (isRangeConstraint(applicantType)) {
            if (min === undefined || max === undefined)
                throw new AppError(ERROR_CODES.COMPOSITION_FIELDS_NOT_FOUND);
            if (min > max)
                throw new AppError(ERROR_CODES.INVALID_COMPOSITION_VALUE);
        }
        else if (isListConstraint(applicantType)) {
            if (!dto.item)
                throw new Error(ERROR_CODES.COMPOSITION_FIELDS_NOT_FOUND);

            const allowedOptions = getListOptions(applicantType);
            if (!allowedOptions?.includes(dto.item)) {
                throw new Error(ERROR_CODES.INVALID_COMPOSITION_VALUE);
            }
        }
    }

    //----------------------------------------
    // CREATE
    //----------------------------------------
    async create(data: CreateCompositionDTO) {
        await this.validate(data);
        return this.repository.create(data);
    }

    //----------------------------------------
    // GET
    //----------------------------------------
    async getCompositions(options: GetCompositionDTO) {
        return this.repository.find(options);
    }

    //----------------------------------------
    // UPDATE
    //----------------------------------------
    async update(dto: UpdateCompositionDTO) {
        const updated = await this.repository.update(dto);
        if (!updated) throw new Error(ERROR_CODES.COMPOSITION_NOT_FOUND);
    }

    //----------------------------------------
    // DELETE
    //----------------------------------------
    async delete(id: string) {
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.COMPOSITION_NOT_FOUND);
    }
}
