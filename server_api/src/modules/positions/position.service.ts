import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ExperienceRepository, IExperienceRepository } from "../users/experiences/experience.repository";
import {
    CreatePositionDTO,
    GetPositionsDTO,
    UpdatePositionDTO
} from "./position.dto";
import { IPositionRepository, PositionRepository } from "./position.repository";

export class PositionService {

    constructor(
        private readonly positionRepo: IPositionRepository = new PositionRepository(),
        private readonly experienceRepo: IExperienceRepository = new ExperienceRepository()
    ) { }

    /* =========================
       Create Position
    ========================= */
    async create(dto: CreatePositionDTO) {

        // prevent duplicate names
        const exists = await this.positionRepo.exists({ name: dto.name });
        if (exists) {
            throw new AppError(ERROR_CODES.POSITION_ALREADY_EXISTS);
        }

        return await this.positionRepo.create(dto);
    }

    /* =========================
       Get / Find Positions
    ========================= */
    async find(options: GetPositionsDTO = {}) {
        return await this.positionRepo.find(options);
    }

    /* =========================
       Update Position
    ========================= */
    async update(dto: UpdatePositionDTO) {
        const { id, data: dtoData } = dto;

        const updated = await this.positionRepo.update(id, dtoData);
        if (!updated) throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);

        return updated;
    }

    /* =========================
       Delete Position
    ========================= */
    async delete(id: string) {

        // prevent delete if used in experience
        const isUsedInExperience = await this.experienceRepo.exists({ position: id });
        if (isUsedInExperience) {
          throw new AppError(ERROR_CODES.POSITION_IN_USE);
        }

        const deleted = await this.positionRepo.delete(id);
        if (!deleted) throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);

        return deleted;
    }
}