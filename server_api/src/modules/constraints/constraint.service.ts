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

        const { id, data } = dto;

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

        const project = dto.projectConstraints;
        const collaborator = dto.collaboratorConstraints;
        const phase = dto.phaseConstraints;
        const activity = dto.activityConstraints;
        const equipment = dto.equipmentConstraints;
        const component = dto.componentConstraints;

        const ranges = [
            // Project: text length
            ["Title words", project?.titleWords],
            ["Summary words", project?.summaryWords],
            ["Keywords", project?.keyWords],

            // Project: objectives
            ["General objective words", project?.generalObjectiveWords],
            ["Specific objective words", project?.specificObjectiveWords],
            ["Number of specific objectives", project?.specificObjectives],

            // Project: expected outputs
            ["Number of expected outputs", project?.expectedOutputs],
            ["Expected output words", project?.expectedOutputWords],

            // Project: budget & time
            ["Project budget", project?.budget],
            ["Project duration", project?.duration],

            // Project: classification
            ["Themes", project?.themes],

            // Collaborators
            ["Members", collaborator?.members],

            // Phases
            ["Number of phases", phase?.phases],
            ["Phase budget", phase?.budget],
            ["Phase duration", phase?.duration],

            // Activities
            ["Number of activities", activity?.activities],
            ["Activity cost", activity?.cost],
            ["Activity duration", activity?.duration],

            // Equipments
            ["Number of equipments", equipment?.equipments],
            ["Equipment cost", equipment?.cost],

            // Components
            ["Number of components", component?.components],
            ["Component collaborators", component?.collaborators],
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