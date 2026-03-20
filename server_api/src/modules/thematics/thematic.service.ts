import { Unit } from "../../common/constants/enums";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CreateThematicDTO, GetThematicsDTO, UpdateThematicDTO } from "./thematic.dto";
import { IThematicRepository, ThematicRepository } from "./thematic.repository";
import { THEMATIC_TRANSITIONS, ThematicStatus } from "./thematic.state-machine";
import { IThemeRepository, ThemeRepository } from "./themes/theme.repository";

export class ThematicService {

    constructor(
        private readonly repository: IThematicRepository = new ThematicRepository(),
        private readonly themeRepo: IThemeRepository = new ThemeRepository(),
        //private readonly organizationRepo: IOrganizationRepository = new OrganizationRepository(),
    ) { }


    async create(dto: CreateThematicDTO) {
        /*
        const directorateDoc = await this.organizationRepo.findById(dto.directorate);
        if (!directorateDoc || directorateDoc.type !== Unit.directorate) {
            throw new Error(ERROR_CODES.DIRECTORATE_NOT_FOUND);
        }
        */
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

    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const evalDoc = await this.repository.findById(id);
        if (!evalDoc) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }
        const from = evalDoc.status as ThematicStatus;
        const to = next as ThematicStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            THEMATIC_TRANSITIONS
        );

        if (next === ThematicStatus.draft) {
            //if (await this.callRepository.exists({ calendar: id })) {
            // throw new AppError(ERROR_CODES.CALL_ALREADY_EXISTS);
            // }
        }

        return await this.repository.update(id, {
            status: to
        });
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const themeExist = await this.themeRepo.exists({ thematicArea: id });
        if (themeExist) {
            throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS);
        }
        return await this.repository.delete(id);
    }
}
