import { ConstraintRepository } from "./constraint.repository";
import { CreateConstraintDTO, UpdateConstraintDTO } from "./constraint.dto";
import { IConstraint } from "./constraint.model";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { isValidRange } from "../../common/types/range";


export class ConstraintService {

    constructor(
        private readonly repository: ConstraintRepository
    ) { }


    async create(
        dto: CreateConstraintDTO
    ): Promise<IConstraint> {

        const exists = await this.repository.exists(dto.name);

        if (exists) {
            throw new AppError(
                ERROR_CODES.DUPLICATE_ENTRY,
                "Constraint name already exists."
            );
        }

        this.validateRange(dto);

        return await this.repository.create(dto);
    }


    async findById(
        id: string
    ): Promise<IConstraint | null> {
        return await this.repository.findById(id);
    }


    async findAll(): Promise<IConstraint[]> {
        return await this.repository.findAll();
    }


    async update(
        id: string,
        dto: UpdateConstraintDTO
    ): Promise<IConstraint | null> {

        if (dto.data.name) {
            const exists = await this.repository.exists(
                dto.data.name,
                id
            );

            if (exists) {
                throw new AppError(
                    ERROR_CODES.DUPLICATE_ENTRY,
                    "Constraint name already exists."
                );
            }
        }

        this.validateRange(dto.data);

        return await this.repository.update(id, dto);
    }


    async delete(
        id: string
    ): Promise<IConstraint | null> {

        return await this.repository.delete(id);
    }


    private validateRange(
        dto: Partial<CreateConstraintDTO>
    ): void {

        const ranges = [
            ["Participants", dto.participants],
            ["Phases", dto.phases],
            ["Budget", dto.budget],
            ["Duration", dto.duration],
            ["Budget per phase", dto.budgetPerPhase],
            ["Duration per phase", dto.durationPerPhase],
            ["Themes", dto.themes],
            ["Sub themes", dto.subThemes],
            ["Focus areas", dto.focusAreas],
            ["Indicators", dto.indicators],
        ] as const;


        for (const [name, range] of ranges) {

            if (!range) {
                continue;
            }

            if (!isValidRange(range)) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `${name} range is invalid.`
                );
            }
        }
    }
}