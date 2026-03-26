import { DeleteDto } from "../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { IGrantRepository } from "../grants/grant.repository";
import { CreateThematicDTO, GetThematicsDTO, UpdateThematicDTO } from "./thematic.dto";
import { themeLevelIndex } from "./thematic.enum";
import { IThematicRepository } from "./thematic.repository";
import { THEMATIC_TRANSITIONS, ThematicStatus } from "./thematic.state-machine";
import { ITheme } from "./themes/theme.model";
import { IThemeRepository } from "./themes/theme.repository";

export class ThematicService {

    constructor(
        private readonly repository: IThematicRepository,
        private readonly themeRepo: IThemeRepository,
        private readonly grantRepo: IGrantRepository,
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

        const thematicDoc = await this.repository.findById(id);
        if (!thematicDoc) {
            throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);
        }
        const from = thematicDoc.status as ThematicStatus;
        const to = next as ThematicStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            THEMATIC_TRANSITIONS
        );

        if (to === ThematicStatus.published) {
            // 1. Get all themes for this area
            const themes = await this.themeRepo.find({ thematicArea: id });

            if (themes.length === 0) {
                throw new AppError(
                    ERROR_CODES.THEMATIC_EMPTY,
                    "Cannot publish an empty thematic area."
                );
            }

            const maxLevel = themeLevelIndex[thematicDoc.level];

            // 2. Build parent → children map and _id → theme map for tracing
            const childrenMap = new Map<string, ITheme[]>();
            const themeMap = new Map<string, ITheme>();

            for (const theme of themes) {
                const parentId = theme.parent ? theme.parent.toString() : "root";

                if (!childrenMap.has(parentId)) {
                    childrenMap.set(parentId, []);
                }
                childrenMap.get(parentId)!.push(theme);

                if (theme._id) {
                    themeMap.set(theme._id.toString(), theme);
                }
            }

            // 3. Validate (fail fast) with full path
            for (const theme of themes) {
                const isAtMaxDepth = theme.level === maxLevel;

                // If NOT deepest → must have children
                if (!isAtMaxDepth) {
                    if (!theme._id) continue;

                    const key = theme._id.toString();
                    const children = childrenMap.get(key);

                    if (!children || children.length === 0) {
                        // Trace path from root to this theme
                        const path: string[] = [];
                        let current: ITheme | undefined = theme;

                        while (current) {
                            path.unshift(current.title); // prepend to path
                            if (!current.parent) break;
                            current = themeMap.get(current.parent.toString());
                        }

                        throw new AppError(
                            ERROR_CODES.INVALID_THEME_STRUCTURE,
                            `Theme hierarchy incomplete: ${path.join(" → ")}`
                        );
                    }
                }
            }
        }
        // --- REVERT TO DRAFT CHECK ---
        if (to === ThematicStatus.draft) {
            const isInUse = await this.grantRepo.exists({ thematic: id });
            if (isInUse) {
                throw new AppError(ERROR_CODES.THEMATIC_IN_USE, "Cannot revert to draft; this thematic area is already linked to a Grant.");
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
        // 1. Delete all themes belonging to this area
        await this.themeRepo.deleteMany({ thematic: id });
        // 2. Delete the thematic area
        return await this.repository.delete(id);
    }
}
