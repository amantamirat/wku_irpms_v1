import { Unit } from "../../../common/constants/enums";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IOrganizationRepository } from "../../organization/organization.repository";
import { IUserRepository } from "../user.repository";
import { IPositionRepository } from "../../positions/position.repository";
import {
    CreateExperienceDTO,
    FilterExperiencesDTO,
    UpdateExperienceDTO
} from "./experience.dto";
import { IExperienceRepository } from "./experience.repository";
import { FilterOptions } from "../../../common/dtos/filter.dto";

export class ExperienceService {

    constructor(
        private readonly repository: IExperienceRepository,
        private readonly userRepo: IUserRepository,
        private readonly organizationRepo: IOrganizationRepository,
        private readonly posRepository: IPositionRepository
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
            const posDoc = await this.posRepository.findById(position);
            if (!posDoc)
                throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);
        }



    }

    async create(dto: CreateExperienceDTO) {
        const { user, organization, position } = dto;

        const userDoc = await this.userRepo.findById(user);
        if (!userDoc)
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);

        await this.validate(dto);

        const created = await this.repository.create(dto);

        return this.repository.findById(String(created._id), { populate: true });
    }

    async update(dto: UpdateExperienceDTO) {
        const { id, data } = dto;
        await this.validate(data);
        const experienceDoc = await this.repository.findById(id);
        if (!experienceDoc) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);
        await this.repository.update(id, data);
        return this.repository.findById(id, { populate: true });
    }

    async delete(id: string) {
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);
    }
}
