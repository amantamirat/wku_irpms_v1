import { CompositionRepository, ICompositionRepository } from "./composition.repository";
import { IApplicantConstraint } from "../applicant/applicant-constraint.model";
import { isRangeConstraint, isListConstraint, ApplicantConstraintType, getListOptions } from "../applicant/applicant-constaint-type";
import { CreateCompositionDTO, GetCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { ConstraintRepository, IConstraintRepository } from "../constraint.repository";


export class CompositionService {

    constructor(
        private readonly repository: ICompositionRepository = new CompositionRepository(),
        private readonly constraintRepo: IConstraintRepository = new ConstraintRepository(),
    ) { }


    //----------------------------------------
    // VALIDATION
    //----------------------------------------
    private async validateComposition(dto: CreateCompositionDTO) {

        const constraintDoc = await this.constraintRepo.findById(dto.constraint) as IApplicantConstraint;
        if (!constraintDoc) throw new Error("Applicant constraint not found.");

        const applicantType = constraintDoc.constraint as ApplicantConstraintType;

        if (isRangeConstraint(applicantType)) {
            if (dto.min === undefined || dto.max === undefined) {
                throw new Error(`Range must be specified for ${applicantType} constraint.`);
            }
            if (dto.min > dto.max) {
                throw new Error('Minimum value cannot be greater than maximum value.');
            }
        }

        if (isListConstraint(applicantType)) {
            if (!dto.item) {
                throw new Error(`Item must be specified for ${applicantType} constraint.`);
            }
            const allowedOptions = getListOptions(applicantType);
            if (!allowedOptions?.includes(dto.item)) {
                throw new Error(`Invalid item "${dto.item}" for ${applicantType} constraint. Allowed options: ${allowedOptions?.join(", ")}`);
            }
        }

        if (dto.value !== undefined && dto.value < 0) {
            throw new Error("Value must be a positive number.");
        }
    }

    //----------------------------------------
    // CREATE
    //----------------------------------------
    async createComposition(data: CreateCompositionDTO) {
        await this.validateComposition(data);
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
    async updateComposition(dto: UpdateCompositionDTO) {
        const existing = await this.repository.findById(dto.id);
        if (!existing) throw new Error("Composition not found");

        // Merge updates for validation
        // const updatedData = { ...existing.toObject(), ...dto.data };
        //  await this.validateComposition(updatedData);

        return this.repository.update(dto);
    }

    //----------------------------------------
    // DELETE
    //----------------------------------------
    async deleteComposition(id: string) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new Error("Composition not found");
        return this.repository.delete(id);
    }
}
