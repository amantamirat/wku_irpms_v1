import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IOrganizationRepository } from "../../organization/organization.repository";
import { Unit } from "../../organization/organization.type";
import { IApplicantRepository } from "../applicant.repository";
import { PositionType } from "../positions/position.enum";
import { IPositionRepository } from "../positions/position.repository";
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
        private readonly applicantRepository: IApplicantRepository,
        private readonly organizationRepository: IOrganizationRepository,
        private readonly posRepository: IPositionRepository
    ) { }

    async getExperiences(options: GetExperiencesDTO) {
        return this.repository.find({ ...options, populate: true });
    }

    async validate(dto: { organization?: string, position?: string, rank?: string }) {
        const { organization, position, rank } = dto;
        if (organization) {
            const organDoc = await this.organizationRepository.findById(organization);
            if (!organDoc)
                throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

            if (organDoc.type !== Unit.Department && organDoc.type !== Unit.External) {
                throw new AppError(ERROR_CODES.INVALID_ORGANIZATION_TYPE);
            }
        }
        if (position) {
            const posDoc = await this.posRepository.findById(position);
            if (!posDoc)
                throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);

            if (posDoc.type !== PositionType.position)
                throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);

        }
        if (rank) {
            const rankDoc = await this.posRepository.findById(rank);
            if (!rankDoc)
                throw new AppError(ERROR_CODES.RANK_NOT_FOUND);
            if (rankDoc.type !== PositionType.rank)
                throw new AppError(ERROR_CODES.RANK_NOT_FOUND); 
        }
    }

    async create(dto: CreateExperienceDTO) {
        const { applicant, organization, position, rank } = dto;

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
