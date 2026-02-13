import { CompositionRepository, ICompositionRepository } from "./composition.repository";
import { IApplicantConstraint } from "../applicant/applicant-constraint.model";
import { isRangeConstraint, isListConstraint, ApplicantConstraintType, getListOptions, isDynamicConstraint, ApplicantDynamicType } from "../applicant/applicant-constraint-type";
import { CreateCompositionDTO, GetCompositionDTO, UpdateCompositionDTO } from "./composition.dto";
import { ConstraintRepository, IConstraintRepository } from "../constraint.repository";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { ConstraintType } from "../constraint.model";
import { AppError } from "../../../../common/errors/app.error";
import { IOrganizationRepository, OrganizationRepository } from "../../../organization/organization.repository";
import { ISpecializationRepository, SpecializationRepository } from "../../../applicants/specializations/specialization.repository";
import { Unit } from "../../../organization/organization.type";
import { COLLECTIONS } from "../../../../common/constants/collections.enum";


export class CompositionService {

    constructor(
        private readonly repository: ICompositionRepository = new CompositionRepository(),
        private readonly constraintRepo: IConstraintRepository = new ConstraintRepository(),
        private readonly organizationRepo: IOrganizationRepository = new OrganizationRepository(),
        private readonly specRepo: ISpecializationRepository = new SpecializationRepository(),
    ) { }


    //----------------------------------------
    // CREATE
    //----------------------------------------
    async create(dto: CreateCompositionDTO) {
        const { constraint, range, item, enumValue } = dto;
        const constraintDoc = await this.constraintRepo.findById(constraint) as IApplicantConstraint;
        if (!constraintDoc || constraintDoc.type !== ConstraintType.APPLICANT)
            throw new Error(ERROR_CODES.CONSTRAINT_NOT_FOUND);

        const applicantType = constraintDoc.constraint as ApplicantConstraintType;

        if (isRangeConstraint(applicantType)) {
            if (!range)
                throw new AppError(ERROR_CODES.COMPOSITION_RANGE_NOT_FOUND);
            if (range.min > range.max)
                throw new AppError(ERROR_CODES.INVALID_COMPOSITION_RANGE);
        }
        else if (isListConstraint(applicantType)) {
            if (!enumValue) {
                throw new AppError(ERROR_CODES.COMPOSITION_ENUM_NOT_FOUND);
            }
            const allowedOptions = getListOptions(applicantType);
            if (!allowedOptions?.includes(enumValue)) {
                throw new Error(ERROR_CODES.INVALID_COMPOSITION_ENUM);
            }
        }
        else if (isDynamicConstraint(applicantType)) {
            if (!item)
                throw new AppError(ERROR_CODES.COMPOSITION_ITEM_NOT_FOUND);
            if (applicantType === ApplicantDynamicType.WORKSPACE) {
                const workspaceDoc = await this.organizationRepo.findById(item);
                if (!workspaceDoc) {
                    throw new Error(ERROR_CODES.WORKSPACE_NOT_FOUND);
                }
                if (workspaceDoc.type !== Unit.Department && workspaceDoc.type !== Unit.External) {
                    throw new Error(ERROR_CODES.INVALID_WORKSPACE);
                }
                dto.itemModel = COLLECTIONS.ORGANIZATION;
            }
            else if (applicantType === ApplicantDynamicType.SPECIALIZATION) {
                const specDoc = await this.specRepo.findById(item);
                if (!specDoc) {
                    throw new Error(ERROR_CODES.SPECIALIZATION_NOT_FOUND);
                }
                dto.itemModel = COLLECTIONS.SPECIALIZATION;
            }
        }
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            // 5. Handle unique index violations
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.COMPOSITION_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    //----------------------------------------
    // GET
    //----------------------------------------
    async getCompositions(options: GetCompositionDTO) {
        return this.repository.find({ ...options, populate: true });
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
