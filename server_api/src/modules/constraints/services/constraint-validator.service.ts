import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { CreatePhaseDto } from "../../projects/phase/phase.dto";
import { CreateProjectDTO } from "../../projects/project.dto";
import { ThemeRepository } from "../../thematics/themes/theme.repository";
import { IConstraint } from "../constraint.model";
import { ConstraintRepository } from "../constraint.repository";
import {
    IRange,
    matchRange
} from "../../../common/types/range";

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


    private async getConstraint(
        constraintId: string
    ): Promise<IConstraint> {

        const constraint =
            await this.constraintRepo.findById(constraintId);

        if (!constraint) {
            throw new AppError(
                ERROR_CODES.CONSTRAINT_NOT_FOUND
            );
        }

        return constraint;
    }


    async validateProject(
        constraintId: string,
        dto: CreateProjectDTO
    ): Promise<ConstraintValidationResult> {

        const constraint =
            await this.getConstraint(constraintId);

        const errors: string[] = [];

        this.validateParticipants(
            constraint.participants,
            dto.collaborators.length,
            errors
        );

        this.validatePhasesInternal(
            constraint,
            dto.phases,
            errors
        );

        await this.validateThemeInternal(
            constraint,
            dto.themes,
            errors
        );

        return {
            valid: errors.length === 0,
            errors
        };
    }


    async validateParticipantCount(
        constraintId: string,
        count: number
    ): Promise<ConstraintValidationResult> {

        const constraint =
            await this.getConstraint(constraintId);

        const errors: string[] = [];

        this.validateParticipants(
            constraint.participants,
            count,
            errors
        );

        return {
            valid: errors.length === 0,
            errors
        };
    }


    async validatePhases(
        constraintId: string,
        phases: PhaseValidationInput[]
    ): Promise<ConstraintValidationResult> {

        const constraint =
            await this.getConstraint(constraintId);

        const errors: string[] = [];

        this.validatePhasesInternal(
            constraint,
            phases,
            errors
        );

        return {
            valid: errors.length === 0,
            errors
        };
    }


    async validateThemes(
        constraintId: string,
        selectedThemes: string[]
    ): Promise<ConstraintValidationResult> {

        const constraint =
            await this.getConstraint(constraintId);

        const errors: string[] = [];

        await this.validateThemeInternal(
            constraint,
            selectedThemes,
            errors
        );

        return {
            valid: errors.length === 0,
            errors
        };
    }


    private validateParticipants(
        range: IRange | undefined,
        count: number,
        errors: string[]
    ): void {

        if (range && !matchRange(range, count)) {
            errors.push(
                `Participants must be between ${range.min} and ${range.max}. Current count: ${count}.`
            );
        }
    }


    private validatePhaseCount(
        range: IRange | undefined,
        count: number,
        errors: string[]
    ): void {

        if (range && !matchRange(range, count)) {
            errors.push(
                `Phases must be between ${range.min} and ${range.max}. Current count: ${count}.`
            );
        }
    }


    private validateProjectBudget(
        range: IRange | undefined,
        budget: number,
        errors: string[]
    ): void {

        if (range && !matchRange(range, budget)) {
            errors.push(
                `Project budget must be between ${range.min} and ${range.max}. Current budget: ${budget}.`
            );
        }
    }


    private validateProjectDuration(
        range: IRange | undefined,
        duration: number,
        errors: string[]
    ): void {

        if (range && !matchRange(range, duration)) {
            errors.push(
                `Project duration must be between ${range.min} and ${range.max}. Current duration: ${duration}.`
            );
        }
    }


    private validatePhasesInternal(
        constraint: IConstraint,
        phases: PhaseValidationInput[],
        errors: string[]
    ): void {

        this.validatePhaseCount(
            constraint.phases,
            phases.length,
            errors
        );

        const projectBudget = phases.reduce(
            (sum, phase) => sum + phase.budget,
            0
        );

        this.validateProjectBudget(
            constraint.budget,
            projectBudget,
            errors
        );

        const projectDuration = phases.reduce(
            (sum, phase) => sum + phase.duration,
            0
        );

        this.validateProjectDuration(
            constraint.duration,
            projectDuration,
            errors
        );

        for (const phase of phases) {

            if (
                constraint.budgetPerPhase &&
                !matchRange(
                    constraint.budgetPerPhase,
                    phase.budget
                )
            ) {
                errors.push(
                    `Phase "${phase.title}" budget must be between ${constraint.budgetPerPhase.min} and ${constraint.budgetPerPhase.max}. Current budget: ${phase.budget}.`
                );
            }

            if (
                constraint.durationPerPhase &&
                !matchRange(
                    constraint.durationPerPhase,
                    phase.duration
                )
            ) {
                errors.push(
                    `Phase "${phase.title}" duration must be between ${constraint.durationPerPhase.min} and ${constraint.durationPerPhase.max}. Current duration: ${phase.duration}.`
                );
            }
        }
    }


    private async validateThemeInternal(
        constraint: IConstraint,
        selectedThemes: string[],
        errors: string[]
    ): Promise<void> {

        const counts =
            await this.countThemeLevels(selectedThemes);

        this.validateThemeLevel(
            "Theme",
            counts[0]?.size ?? 0,
            constraint.themes,
            errors
        );

        this.validateThemeLevel(
            "Sub-theme",
            counts[1]?.size ?? 0,
            constraint.subThemes,
            errors
        );

        this.validateThemeLevel(
            "Focus Area",
            counts[2]?.size ?? 0,
            constraint.focusAreas,
            errors
        );

        this.validateThemeLevel(
            "Indicator",
            counts[3]?.size ?? 0,
            constraint.indicators,
            errors
        );
    }


    private validateThemeLevel(
        label: string,
        count: number,
        range: IRange | undefined,
        errors: string[]
    ): void {

        if (range && !matchRange(range, count)) {
            errors.push(
                `${label} count must be between ${range.min} and ${range.max}. Current count: ${count}.`
            );
        }
    }


    private async countThemeLevels(
        selectedThemes: string[]
    ) {

        const levels: Record<number, Set<string>> = {};

        for (const id of selectedThemes) {

            let current =
                await this.themeRepo.findById(id);

            if (!current) {
                throw new AppError(
                    ERROR_CODES.THEME_NOT_FOUND
                );
            }

            while (current) {

                if (!levels[current.level]) {
                    levels[current.level] = new Set();
                }

                levels[current.level].add(
                    current._id.toString()
                );

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