import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ExperienceRepository, IExperienceRepository } from "../users/experiences/experience.repository";
import {
    CreatePositionDTO,
    GetPositionsDTO,
    UpdatePositionDTO
} from "./position.dto";
import { PositionType } from "./position.model";
import { IPositionRepository, PositionRepository } from "./position.repository";

export class PositionService {

    constructor(
        private readonly positionRepo: IPositionRepository = new PositionRepository(),
        private readonly experienceRepo: IExperienceRepository = new ExperienceRepository()
    ) { }

    /* =========================
       Validate for Rank
    ========================= */
    private async validatePosition(data: CreatePositionDTO) {
        if (data.parent) {
            const parentDoc = await this.positionRepo.findById(data.parent.toString());
            if (!parentDoc) throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);
        }
    }

    /* =========================
       Create Position / Rank
    ========================= */
    async create(dto: CreatePositionDTO) {
        if (dto.type === PositionType.rank) {
            if (!dto.parent) throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);

            const parentDoc = await this.positionRepo.findById(dto.parent);
            if (!parentDoc) throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);
        }
        const created = await this.positionRepo.create(dto);
        return created;
    }

    /* =========================
       Get / Find Positions
    ========================= */
    async find(options: GetPositionsDTO = {}) {
        return await this.positionRepo.find(options);
    }

    /* =========================
       Update Position / Rank
    ========================= */
    async update(dto: UpdatePositionDTO) {
        const { id, data: dtoData } = dto;
        const updated = await this.positionRepo.update(id, dtoData);
        if (!updated) throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);
        return updated;
    }

    /* =========================
       Delete Position / Rank
    ========================= */
    async delete(id: string) {
        const hasRanks = await this.positionRepo.exists({ parent: id });
        if (hasRanks) throw new AppError(ERROR_CODES.RANK_ALREADY_EXISTS);
        const isUsedInExperience = await this.experienceRepo.exists({ rank: id });
        if (isUsedInExperience) {
            throw new AppError(ERROR_CODES.RANK_IN_USE);
        }
        const deleted = await this.positionRepo.delete(id);
        if (!deleted) throw new AppError(ERROR_CODES.POSITION_NOT_FOUND);
        return deleted;
    }
}
