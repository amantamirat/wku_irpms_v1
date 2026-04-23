
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IUserRepository, UserRepository } from "../../users/user.repository";
import { CreateSpecializationDTO, UpdateSpecializationDTO } from "./specialization.dto";
import { ISpecializationRepository, SpecializationRepository } from "./specialization.repository";

export class SpecializationService {

    constructor(private readonly repository: ISpecializationRepository = new SpecializationRepository(),
        private readonly userRepo: IUserRepository = new UserRepository()
    ) { }

    async create(dto: CreateSpecializationDTO) {
        return await this.repository.create(dto);
    }

    async getAll() {
        const specializations = await this.repository.find({});
        return specializations;
    }

    async update(dto: UpdateSpecializationDTO) {
        const { id, data } = dto;

        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error(ERROR_CODES.SPECIALIZATION_NOT_FOUND);

        return updated;
    }

    async delete(id: string) {
        const exist = await this.userRepo.exists({ specialization: id });
        if (exist) {
            throw new AppError(ERROR_CODES.SPECIALIZATION_IN_USE);
        }
        const deleted = await this.repository.delete(id);
        if (!deleted)
            throw new Error(ERROR_CODES.SPECIALIZATION_NOT_FOUND);
    }
}
