import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CreateGrantDTO, GetGrantsDTO, TransitionGrantDTO, UpdateGrantDTO } from "./grant.dto";
import { GrantRepository, IGrantRepository } from "./grant.repository";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { FundingSource, GrantStatus } from "./grant.model";
import { ConstraintRepository, IConstraintRepository } from "./constraints/constraint.repository";
import { CallRepository, ICallRepository } from "../calls/call.repository";
import { IThematicRepository, ThematicRepository } from "../thematics/thematic.repository";
import { GRANT_TRANSITIONS } from "./grant.state-machine";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { Unit } from "../../common/constants/enums";

export class GrantService {

    constructor(
        private readonly grantRepository: IGrantRepository = new GrantRepository(),
        private readonly organizationRepository: IOrganizationRepository = new OrganizationRepository(),
        private readonly constraintRepo: IConstraintRepository = new ConstraintRepository(),
        private readonly callRepo: ICallRepository = new CallRepository(),
        private readonly thematicRepository: IThematicRepository = new ThematicRepository(),
    ) { }

    async create(dto: CreateGrantDTO) {
        const { fundingSource, organization } = dto;

        const orgDoc = await this.organizationRepository.findById(organization);
        if (!orgDoc) throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

        if (fundingSource === FundingSource.INTERNAL)
            if (orgDoc.type !== Unit.directorate) {
                throw new AppError(ERROR_CODES.DIRECTORATE_NOT_FOUND);
            }
        if (fundingSource === FundingSource.EXTERNAL)
            if (orgDoc.type !== Unit.external) {
                throw new AppError(ERROR_CODES.EXTERNAL_NOT_FOUND);
            }

        const thematicsDoc = await this.thematicRepository.findById(dto.thematic);
        if (!thematicsDoc) throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);
        const created = await this.grantRepository.create(dto);
        return created;
    }

    async get(options: GetGrantsDTO) {
        return await this.grantRepository.find(options);
    }

    async getById(id: string) {
        const grant = await this.grantRepository.findById(id);
        if (!grant) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        return grant;
    }

    async update(dto: UpdateGrantDTO) {
        const { id, data } = dto;
        const grantDoc = await this.grantRepository.update(id, data);
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }
        return grantDoc;
    }

    async transitionState(dto: TransitionRequestDto) {

        const { id, current, next } = dto;

        const grant = await this.grantRepository.findById(id);
        if (!grant) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        const from = grant.status as GrantStatus;
        const to = next as GrantStatus;

        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            GRANT_TRANSITIONS
        );

        return await this.grantRepository.update(id, {
            status: to
        });
    }

    async delete(id: string) {
        if (await this.callRepo.exists({ grant: id }))
            throw new AppError(ERROR_CODES.CALL_ALREADY_EXISTS);

        if (await this.constraintRepo.exists({ grant: id }))
            throw new AppError(ERROR_CODES.CONSTRAINT_ALREADY_EXISTS);

        const deleted = await this.grantRepository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
    }
}
