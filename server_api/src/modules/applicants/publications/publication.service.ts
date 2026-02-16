import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../util/delete.dto";
import { ApplicantRepository } from "../applicant.repository";
import {
    CreatePublicationDTO,
    GetPublicationsOptions,
    UpdatePublicationDTO
} from "./publication.dto";
import { PublicationRepository } from "./publication.repository";

export class PublicationService {

    constructor(
        private readonly repository: PublicationRepository,
        private readonly applicantRepository: ApplicantRepository
    ) { }

    async create(dto: CreatePublicationDTO) {
        const { applicant } = dto;

        // 1. Validate applicant
        const applicantDoc = await this.applicantRepository.findById(applicant);
        if (!applicantDoc) {
            throw new AppError(ERROR_CODES.APPLICANT_NOT_FOUND);
        }

        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            // 2. Handle unique index violations (if any added later)
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PUBLICATION_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async get(options: GetPublicationsOptions) {
        return await this.repository.find(options);
    }

    async update(dto: UpdatePublicationDTO) {
        const { id, data } = dto;

        // 1. Ensure publication exists
        const existing = await this.repository.findById(id);
        if (!existing) {
            throw new AppError(ERROR_CODES.PUBLICATION_NOT_FOUND);
        }

        // NOTE:
        // applicant & type are immutable → intentionally not validated here

        try {
            const updated = await this.repository.update(id, data);
            if (!updated) {
                // Defensive: should not happen due to step 1
                throw new AppError(ERROR_CODES.PUBLICATION_NOT_FOUND);
            }
            return updated;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PUBLICATION_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;

        const deleted = await this.repository.delete(id);
        if (!deleted) {
            throw new AppError(ERROR_CODES.PUBLICATION_NOT_FOUND);
        }
        return deleted;
    }
}
