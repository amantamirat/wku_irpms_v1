import { IThemeRepository, ThemeRepository } from "./theme.repository";
import { CreateThemeDTO, GetThemeDTO, UpdateThemeDTO } from "./theme.dto";
import { IThematicRepository, ThematicRepository } from "../thematic.repository";
import { DeleteDto } from "../../../util/delete.dto";
import { themeLevelIndex } from "../thematic.enum";



export class ThemeService {
    private repository: IThemeRepository;
    private thematicRepo: IThematicRepository;

    constructor(repository?: IThemeRepository) {
        this.repository = repository || new ThemeRepository();
        this.thematicRepo = new ThematicRepository();
    }

    async create(dto: CreateThemeDTO) {
        const { thematicArea, parent } = dto;
        dto.level = 0;
        const thematicDoc = await this.thematicRepo.findById(thematicArea);
        if (!thematicDoc) {
            throw new Error("Thematic Area Not Found!");
        }
        if (parent) {
            const parentDoc = await this.repository.findById(parent);
            if (!parentDoc) {
                throw new Error("Parent Theme Not Found!");
            }
            dto.level = parentDoc.level + 1;
        }
        const levelIndex = themeLevelIndex[thematicDoc.level];
        if (levelIndex < dto.level) {
            throw new Error("Maximum Theme Level Found");
        }
        return await this.repository.create(dto);
    }

    async getThemes(filters: GetThemeDTO) {
        return await this.repository.find(filters);
    }

    async update(dto: UpdateThemeDTO) {
        const { id, data } = dto;

        const themeDoc = await this.repository.update(id, data);
        if (!themeDoc) throw new Error("Theme not found");

        return themeDoc;
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;

        const themeDoc = await this.repository.findById(id);
        if (!themeDoc) throw new Error("Theme not found");

        return await this.repository.delete(id);
    }

    async importThemes(
        thematicAreaId: string,
        data: any[]
    ) {
        const thematic = await this.thematicRepo.findById(thematicAreaId);
        if (!thematic) throw new Error("Thematic Area Not Found");

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
