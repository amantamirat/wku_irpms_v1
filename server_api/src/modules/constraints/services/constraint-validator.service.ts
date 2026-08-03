import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { CreatePhaseDto } from "../../projects/phase/phase.dto";
import { CreateProjectDTO } from "../../projects/project.dto";
import { ThemeRepository } from "../../thematics/themes/theme.repository";
import { IConstraint } from "../constraint.model";
import { ConstraintRepository } from "../constraint.repository";

export interface ConstraintValidationResult {
    valid: boolean;
    errors: string[];
}

type PhaseValidationInput = Pick<
    CreatePhaseDto,
    "title" | "budget" | "duration"
>;

export class ConstraintValidationService {

    constructor(
        private readonly constraintRepo: ConstraintRepository,
        private readonly themeRepo: ThemeRepository,
    ) { }


    private async getConstraint(constraintId: string): Promise<IConstraint> {
        const constraint = await this.constraintRepo.findById(constraintId);
        if (!constraint) {
            throw new AppError(ERROR_CODES.CONSTRAINT_NOT_FOUND);
        }
        return constraint;
    }

    async validateProject(constraintId: string, dto: CreateProjectDTO): Promise<ConstraintValidationResult> {
        const constraint = await this.getConstraint(constraintId);

        const errors: string[] = [];

        // Participants count
        this.validateParticipants(constraint, dto.collaborators.length, errors);
        //Project Phases & budget and duration
        this.validatePhasesInternal(constraint, dto.phases, errors);
        //Project themes
        this.validateThemeInternal(constraint, dto.themes, errors);

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async validateParticipantCount(constraintId: string, count: number): Promise<ConstraintValidationResult> {
        const constraint = await this.getConstraint(constraintId);

        const errors: string[] = [];
        this.validateParticipants(constraint, count, errors);
        return {
            valid: errors.length === 0,
            errors
        };
    }

    async validatePhases(constraintId: string, phases: PhaseValidationInput[]): Promise<ConstraintValidationResult> {
        const constraint = await this.getConstraint(constraintId);

        const errors: string[] = [];

        this.validatePhasesInternal(constraint, phases, errors);

        return {
            valid: errors.length === 0,
            errors
        };
    }

    async validateThemes(constraintId: string, selectedThemes: string[]): Promise<ConstraintValidationResult> {
        const constraint = await this.getConstraint(constraintId);
        const errors: string[] = [];
        await this.validateThemeInternal(constraint, selectedThemes, errors);
        return {
            valid: errors.length === 0,
            errors
        };
    }

    private validateParticipants(constraint: IConstraint, count: number, errors: string[]) {
        if (
            constraint.minParticipants !== undefined &&
            count < constraint.minParticipants
        ) {
            errors.push(`Minimum participants is ${constraint.minParticipants}.`);
        }

        if (
            constraint.maxParticipants !== undefined &&
            count > constraint.maxParticipants
        ) {
            errors.push(`Maximum participants is ${constraint.maxParticipants}.`);
        }
    }


    private validatePhaseCount(constraint: IConstraint, count: number, errors: string[]) {
        if (
            constraint.minPhases !== undefined &&
            count < constraint.minPhases
        ) {
            errors.push(`Minimum phases is ${constraint.minPhases}.`);
        }

        if (
            constraint.maxPhases !== undefined &&
            count > constraint.maxPhases
        ) {
            errors.push(`Maximum phases is ${constraint.maxPhases}.`);
        }
    }

    private validateProjectBudget(constraint: IConstraint, budget: number, errors: string[]) {
        if (
            constraint.minBudget !== undefined &&
            budget < constraint.minBudget
        ) {
            errors.push(`Minimum project budget is ${constraint.minBudget}.`);
        }

        if (constraint.maxBudget !== undefined
            && budget > constraint.maxBudget) {
            errors.push(`Maximum project budget is ${constraint.maxBudget}.`);
        }
    }

    private validateProjectDuration(constraint: IConstraint, duration: number, errors: string[]) {
        if (
            constraint.minDuration !== undefined &&
            duration < constraint.minDuration
        ) {
            errors.push(`Minimum project duration is ${constraint.minDuration}.`);
        }

        if (constraint.maxDuration !== undefined && duration > constraint.maxDuration) {
            errors.push(`Maximum project duration is ${constraint.maxDuration}.`);
        }
    }

    private validatePhasesInternal(constraint: IConstraint, phases: PhaseValidationInput[], errors: string[]) {
        // Phases count
        this.validatePhaseCount(constraint, phases.length, errors);

        // Project budget
        const projectBudget = phases.reduce(
            (sum, phase) => sum + phase.budget, 0);

        this.validateProjectBudget(constraint, projectBudget, errors);

        // Project duration
        const projectDuration = phases.reduce(
            (sum, phase) => sum + phase.duration, 0);

        this.validateProjectDuration(constraint, projectDuration, errors);

        for (const phase of phases) {

            if (
                constraint.minBudgetPerPhase !== undefined &&
                phase.budget < constraint.minBudgetPerPhase
            ) {
                errors.push(
                    `Phase "${phase.title}" budget must be at least ${constraint.minBudgetPerPhase}.`
                );
            }

            if (
                constraint.maxBudgetPerPhase !== undefined &&
                phase.budget > constraint.maxBudgetPerPhase
            ) {
                errors.push(
                    `Phase "${phase.title}" budget cannot exceed ${constraint.maxBudgetPerPhase}.`
                );
            }

            if (
                constraint.minDurationPerPhase !== undefined &&
                phase.duration < constraint.minDurationPerPhase
            ) {
                errors.push(
                    `Phase "${phase.title}" duration must be at least ${constraint.minDurationPerPhase}.`
                );
            }

            if (
                constraint.maxDurationPerPhase !== undefined &&
                phase.duration > constraint.maxDurationPerPhase
            ) {
                errors.push(
                    `Phase "${phase.title}" duration cannot exceed ${constraint.maxDurationPerPhase}.`
                );
            }
        }
    }

    private async validateThemeInternal(constraint: IConstraint, selectedThemes: string[], errors: string[]) {
        const counts = await this.countThemeLevels(selectedThemes);

        this.validateThemeLevel(
            "Theme",
            counts[0]?.size ?? 0,
            constraint.minThemes,
            constraint.maxThemes,
            errors
        );

        this.validateThemeLevel(
            "Sub-theme",
            counts[1]?.size ?? 0,
            constraint.minSubThemes,
            constraint.maxSubThemes,
            errors
        );

        this.validateThemeLevel(
            "Focus Area",
            counts[2]?.size ?? 0,
            constraint.minFocusAreas,
            constraint.maxFocusAreas,
            errors
        );

        this.validateThemeLevel(
            "Indicator",
            counts[3]?.size ?? 0,
            constraint.minIndicators,
            constraint.maxIndicators,
            errors
        );

    }

    private validateThemeLevel(label: string, count: number, min: number | undefined, max: number | undefined, errors: string[])
        : void {
        if (
            min !== undefined &&
            count < min
        ) {
            errors.push(`${label} count must be at least ${min}. Current count: ${count}.`);
        }

        if (
            max !== undefined &&
            count > max
        ) {
            errors.push(`${label} count cannot exceed ${max}. Current count: ${count}.`);
        }
    }

    private async countThemeLevels(selectedThemes: string[]) {

        const levels: Record<number, Set<string>> = {};

        for (const id of selectedThemes) {

            let current = await this.themeRepo.findById(id);

            if (!current) {
                throw new AppError(ERROR_CODES.THEME_NOT_FOUND);
            }

            while (current) {

                if (!levels[current.level]) {
                    levels[current.level] = new Set();
                }

                levels[current.level]
                    .add(current._id.toString());

                if (!current.parent) {
                    break;
                }

                current =
                    await this.themeRepo.findById(
                        current.parent.toString()
                    );
            }
        }

        return levels;
    }

}