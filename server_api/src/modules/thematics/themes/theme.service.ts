import { IThemeRepository, ThemeRepository } from "./theme.repository";
import { CreateThemeDTO, GetThemeDTO, UpdateThemeDTO } from "./theme.dto";
import { IThematicRepository, ThematicRepository } from "../thematic.repository";
import { DeleteDto } from "../../../util/delete.dto";



export class ThemeService {
    private repository: IThemeRepository;
    private thematicRepo: IThematicRepository;

    constructor(repository?: IThemeRepository) {
        this.repository = repository || new ThemeRepository();
        this.thematicRepo = new ThematicRepository();
    }

    async create(dto: CreateThemeDTO) {
        const { thematicArea, parent } = dto;

        // Validate thematicArea
        const thematicDoc = await this.thematicRepo.findById(thematicArea);
        if (!thematicDoc) {
            throw new Error("Thematic Area Not Found!");
        }

        // If parent exists, validate it
        if (parent) {
            const parentDoc = await this.repository.findById(parent);
            if (!parentDoc) {
                throw new Error("Parent Theme Not Found!");
            }
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
}
