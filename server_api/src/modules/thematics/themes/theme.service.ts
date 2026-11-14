import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { themeLevelIndex } from "../thematic.enum";
import { IThematicRepository } from "../thematic.repository";
import { ThematicStatus } from "../thematic.state-machine";
import { CreateThemeDTO, FilterThemeDTO, UpdateThemeDTO } from "./theme.dto";
import { IThemeRepository } from "./theme.repository";

export class ThemeService {

    constructor(
        private readonly repository: IThemeRepository,
        private readonly thematicRepo: IThematicRepository,
    ) { }

    async validateThematic(thematicId: string) {
        const thematicDoc = await this.thematicRepo.findById(thematicId);
        if (!thematicDoc) throw new Error(ERROR_CODES.THEMATIC_NOT_FOUND);
        if (thematicDoc.status !== ThematicStatus.draft) throw new Error(ERROR_CODES.THEMATIC_NOT_DRAFT);
        return thematicDoc;
    }

    async create(dto: CreateThemeDTO) {
        const { parent } = dto;
        dto.level = 0;
        if (parent) {
            const parentDoc = await this.repository.findById(parent);
            if (!parentDoc) throw new Error(ERROR_CODES.THEME_NOT_FOUND);
            dto.level = parentDoc.level + 1;
            dto.thematicArea = String(parentDoc.thematicArea);
        }
        const thematicDoc = await this.validateThematic(dto.thematicArea);
        const levelIndex = themeLevelIndex[thematicDoc.level];
        if (levelIndex < dto.level) {
            throw new Error(ERROR_CODES.INVALID_THEME_LEVEL);
        }
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getThemes(filters: FilterThemeDTO, options?: FilterOptions) {
        if (filters && filters.level !== undefined && filters.level !== null) {
            // Decrement level by 1
            filters.level -= 1;
        }
        //console.log(filters);
        return await this.repository.find(filters, options);
    }

    async getById(id: string) {
        const themeDoc = await this.repository.findById(id);
        if (!themeDoc) throw new AppError(ERROR_CODES.THEME_NOT_FOUND);
        return themeDoc;
    }


    async update(dto: UpdateThemeDTO) {
        const { id, data } = dto;
        const themeDoc = await this.repository.findById(id);
        if (!themeDoc) throw new Error(ERROR_CODES.THEME_NOT_FOUND);
        await this.validateThematic(String(themeDoc.thematicArea));
        try {
            const themeDoc = await this.repository.update(id, data);
            return themeDoc;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const themeDoc = await this.repository.findById(id);
        if (!themeDoc) throw new AppError(ERROR_CODES.THEME_NOT_FOUND);
        await this.validateThematic(String(themeDoc.thematicArea));
        const exists = await this.repository.exists({ parent: id });
        if (exists) {
            throw new AppError(
                ERROR_CODES.THEME_IN_USE,
                `Cannot delete "${themeDoc.title}" because it contains child themes.`
            );
        }
        const deleted = await this.repository.delete(id);
        //if (deleted) await this.repository.deleteMany({ theme: id });
        return deleted;
    }

   
}
