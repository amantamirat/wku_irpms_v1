import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { isValidRange } from "../../../common/types/range";
import { CreateProfileDTO, UpdateProfileDTO } from "./profile.dto";
import { ProfileRepository } from "./profile.repository";
import { IEligibilityProfile } from "./profile.model";


export class ProfileService {

    constructor(
        private readonly repository: ProfileRepository
    ) { }


    async create(
        dto: CreateProfileDTO
    ): Promise<IEligibilityProfile> {

        const exists = await this.repository.findByName(
            dto.name
        );

        if (exists) {
            throw new AppError(
                ERROR_CODES.DUPLICATE_ENTRY,
                "Profile name already exists."
            );
        }

        this.validateRange(dto);

        return await this.repository.create(dto);
    }


    async findById(
        id: string
    ): Promise<IEligibilityProfile | null> {

        return await this.repository.findById(id);
    }


    async findAll(): Promise<IEligibilityProfile[]> {

        return await this.repository.findAll();
    }


    async update(
        dto: UpdateProfileDTO
    ): Promise<IEligibilityProfile | null> {

        const { id, data } = dto;

        const profile =
            await this.repository.findById(id);

        if (!profile) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        if (data.name) {

            const exists =
                await this.repository.findByName(
                    data.name,
                    id
                );

            if (exists) {
                throw new AppError(
                    ERROR_CODES.DUPLICATE_ENTRY,
                    "Profile name already exists."
                );
            }
        }

        this.validateRange(data);

        return await this.repository.update(
            id,
            data
        );
    }


    async delete(
        id: string
    ): Promise<IEligibilityProfile | null> {

        const profile =
            await this.repository.delete(id);

        if (!profile) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        return profile;
    }


    private validateRange(
        dto: Partial<CreateProfileDTO>
    ): void {

        const ranges = [
            ["Age", dto.age],
            ["Experience years", dto.experienceYears],
        ] as const;

        for (const [name, range] of ranges) {

            if (!range) {
                continue;
            }

            if (!isValidRange(range)) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `${name} range is invalid.`
                );
            }
        }
    }
}