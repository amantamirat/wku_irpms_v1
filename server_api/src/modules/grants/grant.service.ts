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
import { CompositionRepository, ICompositionRepository } from "./compositions/composition.repository";
import { ThematicStatus } from "../thematics/thematic.state-machine";
import { GrantStageRepository, IGrantStageRepository } from "./stages/grant.stage.repository";
import { IExternal } from "../organization/organization.model";
import { Ownership } from "../organization/organization.enum";
import { IProjectRepository, ProjectRepository } from "../projects/project.repository";
import { GrantAllocationRepository, IGrantAllocationRepository } from "./allocations/grant.allocation.repository";

export class GrantService {

    constructor(
        private readonly repository: IGrantRepository,
        private readonly organizationRepo: IOrganizationRepository,
        private readonly thematicRepository: IThematicRepository,
        private readonly constraintRepo: IConstraintRepository,
        private readonly compositionRepo: ICompositionRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly allocationRepo: IGrantAllocationRepository
    ) { }

    async create(dto: CreateGrantDTO) {
        const { fundingSource, organization } = dto;

        const orgDoc = await this.organizationRepo.findById(organization);
        if (!orgDoc) throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

        if (fundingSource === FundingSource.INTERNAL)
            if (orgDoc.type !== Unit.directorate) {
                throw new AppError(ERROR_CODES.DIRECTORATE_NOT_FOUND);
            }
        if (fundingSource === FundingSource.EXTERNAL) {
            if (orgDoc.type !== Unit.external) {
                throw new AppError(ERROR_CODES.EXTERNAL_NOT_FOUND);
            }
            if ((orgDoc as IExternal).ownership === Ownership.Internal) {
                throw new AppError(ERROR_CODES.EXTERNAL_NOT_FOUND);
            }
        }
        const thematicsDoc = await this.thematicRepository.findById(dto.thematic);
        if (!thematicsDoc) throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);
        if (thematicsDoc.status !== ThematicStatus.published) throw new AppError(ERROR_CODES.THEMATIC_NOT_PUBLISHED);

        const created = await this.repository.create(dto);
        return created;
    }

    async get(options: GetGrantsDTO) {
        return await this.repository.find(options);
    }

    async getById(id: string) {
        const grant = await this.repository.findById(id);
        if (!grant) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        return grant;
    }

    async update(dto: UpdateGrantDTO) {
        const { id, data } = dto;
        const grantDoc = await this.repository.findById(id);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);

        if (grantDoc.status === GrantStatus.closed) throw new AppError(ERROR_CODES.GRANT_CLOSED);

        // If the admin is trying to change the total amount
        if (data.amount !== undefined && data.amount !== grantDoc.amount) {
            // Find all allocations tied to this grant
            const allocations = await this.allocationRepo.find({ grant: id });
            const totalAllocated = allocations.reduce((sum, a) => sum + (a.totalBudget || 0), 0);

            // 🔥 Protection: Prevent reducing grant below what is already allocated
            if (data.amount < totalAllocated) {
                throw new AppError(
                    ERROR_CODES.INVALID_GRANT_REDUCTION,
                    `Cannot reduce grant to ${data.amount}. Total allocated is currently ${totalAllocated}.`
                );
            }
        }
        return await this.repository.update(id, data);
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const grant = await this.repository.findById(id);
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

        if (next === GrantStatus.planned) {
            if (await this.allocationRepo.exists({ grant: id })) {
                throw new AppError(ERROR_CODES.ALLOCATION_ALREADY_EXISTS);
            }
        }
        if (next === GrantStatus.active) {
            if (!await this.grantStageRepo.exists({ grant: id })) {
                throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            }
        }
        return await this.repository.updateStatus(id, to);
    }

    async delete(id: string) {
        const grantDoc = await this.repository.findById(id);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.planned)
            throw new AppError(ERROR_CODES.GRANT_NOT_PLANNED);

        if (await this.grantStageRepo.exists({ grant: id }))
            throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);

        if (await this.constraintRepo.exists({ grant: id }))
            throw new AppError(ERROR_CODES.CONSTRAINT_ALREADY_EXISTS);

        if (await this.compositionRepo.exists({ grant: id }))
            throw new AppError(ERROR_CODES.COMPOSITION_ALREADY_EXISTS);


        return await this.repository.delete(id);
    }
}
