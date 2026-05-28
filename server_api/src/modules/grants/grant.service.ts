import { Unit } from "../../common/constants/enums";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { CallRepository, ICallRepository } from "../calls/call.repository";
import { IOrganizationRepository } from "../organization/organization.repository";
import { IProjectRepository, ProjectRepository } from "../projects/project.repository";
import { IThematicRepository } from "../thematics/thematic.repository";
import { ThematicStatus } from "../thematics/thematic.state-machine";
import { IGrantAllocationRepository } from "./allocations/grant.allocation.repository";
import { ICompositionRepository } from "./compositions/composition.repository";
import { IConstraintRepository } from "./constraints/constraint.repository";
import { CreateGrantDTO, GetGrantsDTO, UpdateGrantDTO } from "./grant.dto";
import { FundingSource, GrantStatus } from "./grant.model";
import { IGrantRepository } from "./grant.repository";
import { IGrantStageRepository } from "./stages/grant.stage.repository";

export class GrantService {

    constructor(
        private readonly repository: IGrantRepository,
        private readonly organizationRepo: IOrganizationRepository,
        private readonly thematicRepository: IThematicRepository,
        private readonly constraintRepo: IConstraintRepository,
        private readonly compositionRepo: ICompositionRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly allocationRepo: IGrantAllocationRepository,
        private readonly callRepo: ICallRepository = new CallRepository(),
        private readonly projectRepo: IProjectRepository = new ProjectRepository(),
    ) { }

    async create(dto: CreateGrantDTO) {
        const { fundingSource, organization } = dto;

        const organizationDoc = await this.organizationRepo.findById(organization);
        if (!organizationDoc) throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

        if (fundingSource === FundingSource.INTERNAL)
            if (organizationDoc.type !== Unit.directorate) {
                throw new AppError(ERROR_CODES.DIRECTORATE_NOT_FOUND);
            }
        if (fundingSource === FundingSource.EXTERNAL) {
            if (organizationDoc.type !== Unit.external) {
                throw new AppError(ERROR_CODES.EXTERNAL_NOT_FOUND);
            }
        }
        const thematicDoc = await this.thematicRepository.findById(dto.thematic);
        if (!thematicDoc) throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);
        if (thematicDoc.status !== ThematicStatus.published) throw new AppError(ERROR_CODES.THEMATIC_NOT_PUBLISHED);

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

            const calls = await this.callRepo.find({ grant: id });
            const totalAllocated = calls.reduce((sum, a) => sum + (a.budget || 0), 0);

            const minimumAllowed = Math.max(
                totalAllocated,
                grantDoc.usedBudget || 0
            );

            if (data.amount < minimumAllowed) {
                throw new AppError(
                    ERROR_CODES.INVALID_GRANT_REDUCTION,
                    `Cannot reduce grant below ${minimumAllowed}.`
                );
            }
        }
        return await this.repository.update(id, data);
    }

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const grantDoc = await this.repository.findById(id);
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        const from = grantDoc.status as GrantStatus;
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
            if (grantDoc.usedBudget > 0) {
                throw new AppError(
                    ERROR_CODES.GRANT_IN_USE,
                    'This grant is already being used.'
                );
            }
            if (await this.callRepo.exists({ grant: id })) {
                throw new AppError(
                    ERROR_CODES.GRANT_IN_USE,
                    'This grant is already being used by calls.'
                );
            }

            if (await this.projectRepo.exists({ grant: id })) {
                throw new AppError(
                    ERROR_CODES.GRANT_IN_USE,
                    'This grant is already being used by projects.'
                );
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
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        if (grantDoc.status !== GrantStatus.planned) {
            throw new AppError(
                ERROR_CODES.GRANT_NOT_PLANNED,
                'Only grants in planned status can be deleted.'
            );
        }

        if (await this.grantStageRepo.exists({ grant: id })) {
            throw new AppError(
                ERROR_CODES.GRANT_IN_USE,
                'Cannot delete grant because it has defined evaluation stages.'
            );
        }

        if (await this.constraintRepo.exists({ grant: id })) {
            throw new AppError(
                ERROR_CODES.GRANT_IN_USE,
                'Cannot delete grant because it has evaluation constraints configured.'
            );
        }

        if (await this.compositionRepo.exists({ grant: id })) {
            throw new AppError(
                ERROR_CODES.GRANT_IN_USE,
                'Cannot delete grant because it is used in grant compositions.'
            );
        }
        return await this.repository.delete(id);
    }
}

export const GRANT_TRANSITIONS: Record<GrantStatus, GrantStatus[]> = {
    [GrantStatus.planned]: [GrantStatus.active],
    [GrantStatus.active]: [GrantStatus.closed, GrantStatus.planned],
    [GrantStatus.closed]: [GrantStatus.active]
};
