import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { UserRepository } from "../user.repository";
import {
    CreatePublicationDTO,
    GetPublicationsOptions,
    UpdatePublicationDTO
} from "./publication.dto";
import { PublicationRepository } from "./publication.repository";
import { PublicationStatus } from "./publication.model";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { TransitionHelper } from "../../../common/helpers/transition.helper";

export class PublicationService {

    constructor(
        private readonly repository: PublicationRepository,
        private readonly usrRepo: UserRepository
    ) { }

    async create(dto: CreatePublicationDTO) {
        const { author } = dto;

        // 1. Validate applicant
        const userDoc = await this.usrRepo.findById(author);
        if (!userDoc) {
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);
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

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const pubDoc = await this.repository.findById(id);
        if (!pubDoc) {
            throw new AppError(ERROR_CODES.PUBLICATION_NOT_FOUND);
        }
        const from = pubDoc.status as PublicationStatus;
        const to = next as PublicationStatus;
        // optional UI consistency check
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PUBLICATION_TRANSITIONS
        );
        return await this.repository.updateStatus(id,
            to);
    }

    async validatePublication(id: string) {
        const pubDoc = await this.repository.findById(id);
        if (!pubDoc) {
            throw new AppError(ERROR_CODES.PUBLICATION_NOT_FOUND);
        }
        if (pubDoc.status === PublicationStatus.verified) {
            throw new AppError(ERROR_CODES.PUBLICATION_ALREADY_VERIFIED);
        }
        return pubDoc;
    }

    async update(dto: UpdatePublicationDTO) {
        const { id, data } = dto;

        // 1. Ensure publication exists
        const pubDoc = await this.validatePublication(id);


        // NOTE:
        // user & type are immutable → intentionally not validated here

        try {
            return await this.repository.update(id, data);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.PUBLICATION_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        await this.validatePublication(id);
        return await this.repository.delete(id);
    }
}


export const PUBLICATION_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
    [PublicationStatus.pending]: [PublicationStatus.verified],
    [PublicationStatus.verified]: [PublicationStatus.pending]
};
