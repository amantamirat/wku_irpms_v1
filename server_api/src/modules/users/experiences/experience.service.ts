import { Unit } from "../../../common/constants/enums";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IOrganizationRepository } from "../../organization/organization.repository";
import { IUserRepository } from "../user.repository";
import { IPositionRepository } from "../../positions/position.repository";
import {
    CreateExperienceDTO,
    DeleteExperienceDTO,
    GetExperiencesDTO,
    UpdateExperienceDTO
} from "./experience.dto";
import { IExperienceRepository } from "./experience.repository";

export class ExperienceService {

    constructor(
        private readonly repository: IExperienceRepository,
        private readonly applicantRepository: IUserRepository,
        private readonly organizationRepository: IOrganizationRepository,
        private readonly posRepository: IPositionRepository
    ) { }

    async getExperiences(options: GetExperiencesDTO) {
        return this.repository.find({ ...options, populate: true });
    }

    async validate(dto: { organization?: string, position?: string, rank?: string }) {
        const { organization, position } = dto;
        if (organization) {
            const organDoc = await this.organizationRepository.findById(organization);
            if (!organDoc)
                throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

            if (organDoc.type !== Unit.department && organDoc.type !== Unit.external) {
                throw new AppError(ERROR_CODES.INVALID_ORGANIZATION_TYPE);
            }
        }

        if(position){
            const posDoc = await this.posRepository.findById(position);
        if (!posDoc)
            throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);
        }
        


    }

    async create(dto: CreateExperienceDTO) {
        const { user: applicant, organization, position } = dto;

        const applicantDoc = await this.applicantRepository.findById(applicant);
        if (!applicantDoc)
            throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);

        await this.validate(dto);

        return this.repository.create(dto);
    }

    async update(dto: UpdateExperienceDTO) {
        const { id, data } = dto;
        await this.validate(data);
        const existing = await this.repository.findById(id);
        if (!existing) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);
        return this.repository.update(id, data);
    }

    async delete(dto: DeleteExperienceDTO) {
        const deleted = await this.repository.delete(dto.id);
        if (!deleted) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);
    }
}
