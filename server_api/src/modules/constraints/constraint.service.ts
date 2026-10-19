import { ConstraintRepository } from "./constraint.repository";
import { CreateConstraintDTO, UpdateConstraintDTO } from "./constraint.dto";
import { IConstraint } from "./constraint.model";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { isValid } from "../../common/types/range";


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
        dto: UpdateConstraintDTO
    ): Promise<IConstraint | null> {

        const { id, data } = dto

        if (data.name) {
            const exists = await this.repository.exists(
                data.name,
                id
            );

            if (exists) {
                throw new AppError(
                    ERROR_CODES.DUPLICATE_ENTRY,
                    "Constraint name already exists."
                );
            }
        }

        this.validateRange(data);

        return await this.repository.update(id, data);
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
            ["Title words", dto.titleWords],
            ["Summary words", dto.summaryWords],

            // Objectives
            ["General objective words", dto.generalObjectiveWords],
            ["Specific objective words", dto.specificObjectiveWords],
            ["Number of specific objectives", dto.specificObjectives],

            // Expected Outputs
            ["Number of expected outputs", dto.expectedOutputs],
            ["Expected output words", dto.expectedOutputWords],

            // Participants and project structure
            ["Participants", dto.participants],
            ["Phases", dto.phases],

            // Budget and duration
            ["Budget", dto.budget],
            ["Duration", dto.duration],
            ["Phase budget", dto.phaseBudget],           // was budgetPerPhase
            ["Phase duration", dto.phaseDuration],       // was durationPerPhase
            ["Activity duration", dto.activityDuration], // added
            ["Equipment cost", dto.equipmentCost],       // added

            // Research themes
            ["Themes", dto.themes],
            ["Sub themes", dto.subThemes],
            ["Focus areas", dto.focusAreas],
            ["Indicators", dto.indicators],

            // Project resources
            ["Activities", dto.activities],              // was activitiesPerPhase
            ["Equipments", dto.equipments],              // was equipmentsPerPhase
            ["Components", dto.components],              // added
        ] as const;

        for (const [name, range] of ranges) {
            if (!range) {
                continue;
            }

            if (!isValid(range)) {
                throw new AppError(
                    ERROR_CODES.INVALID_INPUT,
                    `${name} range is invalid.`
                );
            }
        }
    }

}