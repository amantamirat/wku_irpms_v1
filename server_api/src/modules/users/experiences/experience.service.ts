import { Unit } from "../../../common/constants/enums";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IOrganizationRepository } from "../../organization/organization.repository";
import { IPositionRepository } from "../../positions/position.repository";
import { IUserRepository } from "../user.repository";
import {
    CreateExperienceDTO,
    FilterExperiencesDTO,
    UpdateExperienceDTO
} from "./experience.dto";
import { ExperienceStatus } from "./experience.model";
import { ExperienceRepository } from "./experience.repository";

export class ExperienceService {

    constructor(
        private readonly repository: ExperienceRepository,
        private readonly userRepo: IUserRepository,
        private readonly organizationRepo: IOrganizationRepository,
        private readonly positionRepo: IPositionRepository
    ) { }

    async getExperiences(filter: FilterExperiencesDTO, options?: FilterOptions) {
        return this.repository.find(filter, options);
    }

    async validate(dto: { organization?: string, position?: string, rank?: string }) {
        const { organization, position } = dto;
        if (organization) {
            const organDoc = await this.organizationRepo.findById(organization);
            if (!organDoc)
                throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

            if (organDoc.type !== Unit.department && organDoc.type !== Unit.external) {
                throw new AppError(ERROR_CODES.INVALID_UNIT);
            }
        }

        if (position) {
            const posDoc = await this.positionRepo.findById(position);
            if (!posDoc)
                throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);
        }
    }

    async create(dto: CreateExperienceDTO, userId: string) {
        const { user, organization, position } = dto;

        const userDoc = await this.userRepo.findById(user);
        if (!userDoc)
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);

        await this.validate(dto);

        const created = await this.repository.create(dto, userId);

        return created;

        //return this.repository.findById(String(created._id), { populate: true });
    }

    async update(dto: UpdateExperienceDTO) {
        const { id, data } = dto;
        await this.validate(data);
        const experienceDoc = await this.repository.findById(id);
        if (!experienceDoc) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);
        if (experienceDoc.status !== ExperienceStatus.PENDING) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_PENDING);
        return await this.repository.update(id, data);
    }


    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next, reason } = dto;

        const thematicDoc = await this.repository.findById(id);
        if (!thematicDoc) {
            throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);
        }
        const from = thematicDoc.status;
        const to = next as ExperienceStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            EXPERIENCE_TRANSITIONS
        );
        return await this.repository.updateStatus(id, to, userId, reason);
    }



    async delete(id: string) {
        const expDoc = await this.repository.findById(id);
        if (!expDoc) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);
        if (expDoc.status && (expDoc.status !== ExperienceStatus.PENDING)) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_PENDING);
        return await this.repository.delete(id);
    }
}



export const EXPERIENCE_TRANSITIONS: Record<
    ExperienceStatus,
    ExperienceStatus[]
> = {
    [ExperienceStatus.PENDING]: [
        ExperienceStatus.VERIFIED,
    ],
    [ExperienceStatus.VERIFIED]: [
        ExperienceStatus.PENDING,
    ],
};
