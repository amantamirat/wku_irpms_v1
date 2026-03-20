import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { CreateThematicDTO, GetThematicsDTO, UpdateThematicDTO } from "./thematic.dto";
import { IThematicRepository, ThematicRepository } from "./thematic.repository";
import { THEMATIC_TRANSITIONS, ThematicStatus } from "./thematic.state-machine";
import { IThemeRepository, ThemeRepository } from "./themes/theme.repository";

export class ThematicService {

    constructor(
        private readonly repository: IThematicRepository = new ThematicRepository(),
        private readonly themeRepo: IThemeRepository = new ThemeRepository(),
        private readonly grantRepo: IGrantRepository = new GrantRepository(),
    ) { }


    async create(dto: CreateThematicDTO) {
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.THEMATIC_ALREADY_EXISTS);
            }
            throw err;
        }
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
            if (await this.grantRepo.exists({ thematic: id })) {
                throw new AppError(ERROR_CODES.GRANT_ALREADY_EXISTS);
            }
        }
        return await this.repository.update(id, {
            status: to
        });
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const thematicDoc = await this.repository.findById(id);
        if (!thematicDoc) throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);
        if (thematicDoc.status !== ThematicStatus.draft) throw new AppError(ERROR_CODES.THEMATIC_NOT_DRAFT);
        
        const themeExist = await this.themeRepo.exists({ thematicArea: id });
        if (themeExist) {
            throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS);
        }
        return await this.repository.delete(id);
    }
}
