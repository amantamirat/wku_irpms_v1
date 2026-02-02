import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { DeleteDto } from "../../util/delete.dto";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { Unit } from "../organization/organization.type";
import { CreateThematicDTO, GetThematicsDTO, UpdateThematicDTO } from "./thematic.dto";
import { IThematicRepository, ThematicRepository } from "./thematic.repository";
import { IThemeRepository, ThemeRepository } from "./themes/theme.repository";

export class ThematicService {

    constructor(
        private readonly repository: IThematicRepository = new ThematicRepository(),
        private readonly themeRepository: IThemeRepository = new ThemeRepository(),
        private readonly organizationRepo: IOrganizationRepository = new OrganizationRepository(),
    ) { }


    async create(dto: CreateThematicDTO) {
        const directorateDoc = await this.organizationRepo.findById(dto.directorate);
        if (!directorateDoc || directorateDoc.type !== Unit.Directorate) {
            throw new Error(ERROR_CODES.DIRECTORATE_NOT_FOUND);
        }
        const createdThematic = await this.repository.create(dto);
        return createdThematic;
    }

    async getThematics(options: GetThematicsDTO) {
        return await this.repository.find(options);
    }

    async update(dto: UpdateThematicDTO) {
        const { id, data, userId } = dto;
        return this.repository.update(id, data);
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const themeExist = await this.themeRepository.exists({ thematicArea: id });
        if (themeExist) {
            throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS);
        }
        return await this.repository.delete(id);
    }
}
