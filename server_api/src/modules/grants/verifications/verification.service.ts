import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IGrantRepository } from "../grant.repository";
import { CreateVerificationDTO, UpdateVerificationDTO } from "./verification.dto";
import { IVerificationRepository } from "./verification.repo";


export class VerificationService {

    constructor(
        private readonly repository: IVerificationRepository,
        private readonly grantRepo: IGrantRepository
    ) { }

    async create(dto: CreateVerificationDTO) {
        const { grant, deadline } = dto;
        // 1. Validate grant existence
        const grantDoc = await this.grantRepo.findById(grant);

        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        // 2. Validate deadline
        if (deadline < new Date()) {
            throw new AppError(ERROR_CODES.INVALID_DEADLINE_DATE);
        }

        // 3. Create verification
        return this.repository.create(dto);
    }

    async update(id: string, data: UpdateVerificationDTO) {

        // 1. Validate verification existence
        const verificationDoc = await this.repository.findById(id);

        if (!verificationDoc) {
            throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);
        }

        // 2. Validate deadline
        if (data.deadline < new Date()) {
            throw new AppError(ERROR_CODES.INVALID_DEADLINE_DATE);
        }

        // 3. Update verification
        const updated = await this.repository.update(id, data);
        return updated;
    }

    async findById(id: string) {
        const verificationDoc = await this.repository.findById(id);

        if (!verificationDoc) {
            throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);
        }

        return verificationDoc;
    }

    async findByGrant(grantId: string) {
        return this.repository.findByGrant(grantId);
    }

    async findAll() {
        return this.repository.findAll();
    }

    async delete(id: string) {

        // 1. Validate existence
        const verificationDoc = await this.repository.findById(id);

        if (!verificationDoc) {
            throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);
        }

        // 2. Delete
        const deleted = await this.repository.delete(id);

        return deleted;
    }
}