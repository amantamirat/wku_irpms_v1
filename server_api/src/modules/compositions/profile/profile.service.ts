import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { UpdateProfileDTO } from "./profile.dto";
import { ProfileRepository } from "./profile.repository";


export class ProfileService {

    constructor(private readonly profileRepository: ProfileRepository) { }


    async create(data: any) {
        return this.profileRepository.create(data);
    }

    async findAll() {
        return this.profileRepository.findAll();
    }

    async getById(id: string) {
        const profile =
            await this.profileRepository.findById(id);
        if (!profile) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }
        return profile;
    }

    async update(dto: UpdateProfileDTO) {

        const { id, data } = dto;
        const profile =
            await this.profileRepository.findById(id);

        if (!profile) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }

        const updatedProfile = await this.profileRepository.update(
            id, data);

        return updatedProfile;

    }


    async delete(id: string) {

        const profile =
            await this.profileRepository.delete(id);


        if (!profile) {
            throw new AppError(
                ERROR_CODES.PROFILE_NOT_FOUND
            );
        }
        return profile;
    }

}


