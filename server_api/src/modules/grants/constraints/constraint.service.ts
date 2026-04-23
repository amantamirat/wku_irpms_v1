import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { GrantRepository, IGrantRepository } from "../grant.repository";
import { CreateConstraintDTO, GetConstraintOptions, UpdateConstraintDTO } from "./constraint.dto";
import { ConstraintType } from "./constraint.model";
import { IThematic } from "../../thematics/thematic.model";
import { ThematicLevel } from "../../thematics/thematic.enum";

const thematicConstraintMap: Record<ThematicLevel, ConstraintType[]> = {
    [ThematicLevel.broad]: [ConstraintType.THEME],
    [ThematicLevel.divison]: [ConstraintType.THEME, ConstraintType.SUB_THEME],
    [ThematicLevel.narrow]: [ConstraintType.THEME, ConstraintType.SUB_THEME, ConstraintType.FOCUS_AREA],
    [ThematicLevel.deep]: [
        ConstraintType.THEME,
        ConstraintType.SUB_THEME,
        ConstraintType.FOCUS_AREA,
        ConstraintType.INDICATOR
    ]
};

export const getParentConstraintType = (current: ConstraintType): ConstraintType | undefined => {
    switch (current) {
        case ConstraintType.INDICATOR:
            return ConstraintType.FOCUS_AREA;
        case ConstraintType.FOCUS_AREA:
            return ConstraintType.SUB_THEME;
        case ConstraintType.SUB_THEME:
            return ConstraintType.THEME;
        default:
            return undefined;
    }
};

export class ConstraintService {

    constructor(
        private readonly repository: IConstraintRepository,
        private readonly grantRepository: IGrantRepository,

    ) { }

    private validateRange(min: number, max: number) {
        if (min > max) {
            throw new AppError(ERROR_CODES.INVALID_CONSTRAINT_RANGE);
        }
    }

    async create(dto: CreateConstraintDTO) {
        const { grant, constraint, min, max } = dto;
        this.validateRange(min, max);
        const grantDoc = await this.grantRepository.findById(grant, true);
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        try {

            /*
                const thematicDoc = grantDoc.thematic as unknown as IThematic;
                if (!thematicConstraintMap[thematicDoc.level]?.includes(constraint)) {
                    throw new AppError(ERROR_CODES.INVALID_CONSTRAINT);
                }
                    */
            if (constraint === ConstraintType.BUDGET_TOTAL) {
                if (max > grantDoc.amount) {
                    throw new AppError(ERROR_CODES.BUDGET_EXCEEDED);
                }
            }
            if (constraint === ConstraintType.BUDGET_PHASE) {
                const budgetConstDoc = await this.repository.findOne(grant, ConstraintType.BUDGET_TOTAL);
                if (!budgetConstDoc) {
                    throw new AppError(ERROR_CODES.PRE_CONSTRAINT_NOT_FOUND,
                        `${ConstraintType.BUDGET_TOTAL} is not defined`);
                }
                if (max > budgetConstDoc.max) {
                    throw new AppError(ERROR_CODES.BUDGET_EXCEEDED,
                        `Budget exceeds ${ConstraintType.BUDGET_TOTAL} capacity`
                    );
                }
            }
            const parentTheme = getParentConstraintType(constraint);
            if (parentTheme) {



                const thmConstDoc = await this.repository.findOne(grant, parentTheme);
                if (!thmConstDoc) {
                    throw new AppError(ERROR_CODES.PRE_CONSTRAINT_NOT_FOUND,
                        `${parentTheme} is not defined`
                    );
                }
                if (thmConstDoc.min > min) {
                    throw new AppError(ERROR_CODES.INVALID_CONSTRAINT);
                }
            }
            //budget limitation mush be handled in here against grant
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.CONSTRAINT_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    //----------------------------------------
    // GET
    //----------------------------------------
    async get(options: GetConstraintOptions) {
        return await this.repository.find(options);
    }


    async update(dto: UpdateConstraintDTO) {
        const { id, data } = dto;
        const constraintDoc = await this.repository.findById(id);
        if (!constraintDoc) {
            throw new AppError(ERROR_CODES.CONSTRAINT_NOT_FOUND);
        }
        this.validateRange(data.min ?? constraintDoc.min, data.max ?? constraintDoc.max);
        return await this.repository.update(dto);
    }

    //----------------------------------------
    // DELETE
    //----------------------------------------
    async delete(id: string) {
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.CONSTRAINT_NOT_FOUND);
    }
}
