import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IOrganizationRepository } from "../../organization/organization.repository";
import { Unit } from "../../organization/organization.type";
import { IApplicantRepository } from "../applicant.repository";
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
        private readonly organizationRepository: IOrganizationRepository
    ) { }

    async getExperiences(options: GetExperiencesDTO) {
        if (options.applicant) {
            return this.repository.findByApplicant(options.applicant);
        }
        return this.repository.findAll();
    }

    async create(dto: CreateExperienceDTO) {
        const { applicant, organization } = dto;

        const applicantDoc = await this.applicantRepository.findOne({ id: applicant });
        if (!applicantDoc)
            throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);

        const organDoc = await this.organizationRepository.findById(organization);
        if (!organDoc)
            throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);

        if (organDoc.type !== Unit.Department && organDoc.type !== Unit.External) {
            throw new AppError(ERROR_CODES.INVALID_ORGANIZATION_TYPE);
        }

        return this.repository.create(dto);
    }

    async update(dto: UpdateExperienceDTO) {
        const { id, data } = dto;

        const existing = await this.repository.findById(id);
        if (!existing) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);

        return this.repository.update(id, data);
    }

    async delete(dto: DeleteExperienceDTO) {
        const deleted = await this.repository.delete(dto.id);
        if (!deleted) throw new AppError(ERROR_CODES.EXPERIENCE_NOT_FOUND);
    }
}
