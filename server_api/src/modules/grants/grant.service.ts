import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CreateGrantDTO, GetGrantsDTO, UpdateGrantDTO } from "./grant.dto";
import { GrantRepository, IGrantRepository } from "./grant.repository";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { Unit } from "../organization/organization.type";
import { FundingSource } from "./grant.model";
import { ConstraintRepository, IConstraintRepository } from "./constraints/constraint.repository";

export class GrantService {

    constructor(
        private readonly grantRepository: IGrantRepository = new GrantRepository(),
        private readonly organizationRepository: IOrganizationRepository = new OrganizationRepository(),
        private readonly constraintRepo: IConstraintRepository = new ConstraintRepository(),
    ) { }

    async create(dto: CreateGrantDTO) {
        const { fundingSource, organization } = dto;

        const orgDoc = await this.organizationRepository.findById(organization);
        if (!orgDoc) throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

        if (fundingSource === FundingSource.INTERNAL)
            if (orgDoc.type !== Unit.Directorate) {
                throw new AppError(ERROR_CODES.DIRECTORATE_NOT_FOUND);
            }
        if (fundingSource === FundingSource.EXTERNAL)
            if (orgDoc.type !== Unit.External) {
                throw new AppError(ERROR_CODES.EXTERNAL_NOT_FOUND);
            }

        const created = await this.grantRepository.create(dto);
        return created;
    }

    async getGrants(options: GetGrantsDTO) {
        return await this.grantRepository.find(options);
    }

    async update(dto: UpdateGrantDTO) {
        const { id, data } = dto;
        const grantDoc = await this.grantRepository.update(id, data);
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }
        return grantDoc;
    }

    async delete(id: string) {
        const constraintExist = await this.constraintRepo.exists({ grant: id });
        if (constraintExist)
            throw new AppError(ERROR_CODES.CONSTRAINT_ALREADY_EXISTS);
        return await this.grantRepository.delete(id);
    }
}
