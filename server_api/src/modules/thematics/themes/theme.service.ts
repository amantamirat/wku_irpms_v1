import { IThemeRepository, ThemeRepository } from "./theme.repository";
import { CreateThemeDTO, GetThemeDTO, UpdateThemeDTO } from "./theme.dto";
import { IThematicRepository, ThematicRepository } from "../thematic.repository";
import { DeleteDto } from "../../../util/delete.dto";
import { themeLevelIndex } from "../thematic.enum";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IProjectThemeRepository, ProjectThemeRepository } from "../../projects/themes/project.theme.repository";
import { AppError } from "../../../common/errors/app.error";

export class ThemeService {

    constructor(
        private readonly repository: IThemeRepository = new ThemeRepository(),
        private readonly thematicRepo: IThematicRepository = new ThematicRepository(),
        private readonly projectThemeRepo: IProjectThemeRepository = new ProjectThemeRepository(),
    ) { }


    async create(dto: CreateThemeDTO) {
        const { thematicArea, parent } = dto;
        dto.level = 0;
        const thematicDoc = await this.thematicRepo.findById(thematicArea);
        if (!thematicDoc) {
            throw new Error(ERROR_CODES.THEMATIC_NOT_FOUND);
        }
        if (parent) {
            const parentDoc = await this.repository.findById(parent);
            if (!parentDoc) {
                throw new Error(ERROR_CODES.THEME_NOT_FOUND);
            }
            dto.level = parentDoc.level + 1;
        }
        const levelIndex = themeLevelIndex[thematicDoc.level];
        if (levelIndex < dto.level) {
            throw new Error(ERROR_CODES.INVALID_THEME_LEVEL);
        }
        return await this.repository.create(dto);
    }

    async getThemes(filters: GetThemeDTO) {
        return await this.repository.find(filters);
    }

    async update(dto: UpdateThemeDTO) {
        const { id, data } = dto;

        const themeDoc = await this.repository.update(id, data);
        if (!themeDoc) throw new Error(ERROR_CODES.THEME_NOT_FOUND);

        return themeDoc;
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;

        const themeExist = await this.repository.exists({ parent: id });
        if (themeExist) throw new Error(ERROR_CODES.THEME_ALREADY_EXISTS);

        const projectThemeExist = await this.projectThemeRepo.exists({ theme: id });
        if (projectThemeExist) throw new Error(ERROR_CODES.PROJECT_THEME_ALREADY_EXISTS);

        return await this.repository.delete(id);
    }

    async importThemes(
        thematicAreaId: string,
        data: any[]
    ) {
        const thematic = await this.thematicRepo.findById(thematicAreaId);
        if (!thematic) throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);

        const maxLevel = themeLevelIndex[thematic.level];

        for (const item of data) {
            await this.createRecursive(
                item,
                thematicAreaId,
                undefined,
                0,
                maxLevel
            );
        }

        return "Import completed";
    }

    private async createRecursive(
        item: any,
        thematicAreaId: string,
        parent: string | undefined,
        level: number,
        maxLevel: number
    ) {
        if (level > maxLevel) return;

        const theme = await this.repository.create({
            title: item.title,
            priority: item.priority,
            thematicArea: thematicAreaId,
            parent,
            level
        });

        if (!item.children) return;

        for (const child of item.children) {
            await this.createRecursive(
                child,
                thematicAreaId,
                String(theme._id),
                level + 1,
                maxLevel
            );
        }
    }
}
