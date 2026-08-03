import { ConstraintRepository } from "./constraint.repository";
import { CreateConstraintDTO, UpdateConstraintDTO } from "./constraint.dto";
import { IConstraint } from "./constraint.model";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";


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

        if (dto.name) {
            const exists = await this.repository.exists(
                dto.name,
                id
            );

            if (exists) {
                throw new AppError(
                    ERROR_CODES.DUPLICATE_ENTRY,
                    "Constraint name already exists."
                );
            }
        }

        this.validateRange(dto);

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
            ["Participants", dto.minParticipants, dto.maxParticipants],
            ["Phases", dto.minPhases, dto.maxPhases],
            ["Budget", dto.minBudget, dto.maxBudget],
            ["Duration", dto.minDuration, dto.maxDuration],
            ["Budget per phase", dto.minBudgetPerPhase, dto.maxBudgetPerPhase],
            ["Duration per phase", dto.minDurationPerPhase, dto.maxDurationPerPhase],
            ["Themes", dto.minThemes, dto.maxThemes],
            ["Sub themes", dto.minSubThemes, dto.maxSubThemes],
            ["Focus areas", dto.minFocusAreas, dto.maxFocusAreas],
            ["Indicators", dto.minIndicators, dto.maxIndicators],
        ];


        for (const [name, min, max] of ranges) {

            if (
                min !== undefined &&
                max !== undefined &&
                min > max
            ) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `${name} minimum cannot be greater than maximum.`
                );
            }
        }
    }
}