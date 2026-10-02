import mongoose from "mongoose";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import {
    IRange,
    matchesRange
} from "../../../common/types/range";
import { PhaseActivityRepository } from "../../projects/phase/activities/phase-activity.repository";
import { CreatePhaseDto, PhaseDto } from "../../projects/phase/phase.dto";
import { PhaseRepository } from "../../projects/phase/phase.repository";
import { ProjectRepository } from "../../projects/project.repository";
import { ThemeRepository } from "../../thematics/themes/theme.repository";
import { IConstraint } from "../constraint.model";
import { ConstraintRepository } from "../constraint.repository";

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}


type PhaseValidationInput = Pick<
    CreatePhaseDto,
    "title" | "budget" | "duration"
> & {
    _id?: string | mongoose.Types.ObjectId;
};

export interface ConstraintValidationInput {
    title: string;
    summary?: string;
    collaboratorsCount: number;
    themes: string[];
    phases: PhaseDto[];
}

export class ConstraintValidationService {

    constructor(
        private readonly constraintRepo: ConstraintRepository,
        private readonly themeRepo: ThemeRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly phaseRepo: PhaseRepository,
        private readonly activityRepo: PhaseActivityRepository,
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

    async validateProjectById(
        constraintId: string,
        projectId: string
    ): Promise<ValidationResult> {

        const constraint =
            await this.getConstraint(constraintId);

        const projectDoc = await this.projectRepo.findById(projectId);
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const errors: string[] = [];

        // --------------------------------------------------
        // Project content
        // --------------------------------------------------

        this.validateTitleWords(
            constraint.titleWords,
            projectDoc.title,
            errors
        );

        this.validateSummaryWords(
            constraint.summaryWords,
            projectDoc.summary,
            errors
        );

        // --------------------------------------------------
        // Participants
        // --------------------------------------------------

        this.validateParticipants(
            constraint.participants,
            projectDoc.totalCollabs ?? 0,
            errors
        );

        const phases = await this.phaseRepo.find({ project: projectId });

        // --------------------------------------------------
        // Phases
        // --------------------------------------------------

        this.validatePhasesInternal(
            constraint,
            phases,
            errors
        );

        // --------------------------------------------------
        // Themes
        // --------------------------------------------------

        await this.validateThemeInternal(
            constraint,
            projectDoc.themes.map(theme => theme.toString()),
            errors
        );

        return {
            valid: errors.length === 0,
            errors
        };
    }


    async validateProject(
        constraintId: string,
        dto: ConstraintValidationInput
    ): Promise<ValidationResult> {

        const constraint =
            await this.getConstraint(constraintId);

        const errors: string[] = [];

        // --------------------------------------------------
        // Project content
        // --------------------------------------------------

        this.validateTitleWords(
            constraint.titleWords,
            dto.title,
            errors
        );

        this.validateSummaryWords(
            constraint.summaryWords,
            dto.summary,
            errors
        );

        // --------------------------------------------------
        // Participants
        // --------------------------------------------------

        this.validateParticipants(
            constraint.participants,
            dto.collaboratorsCount,
            errors
        );

        // --------------------------------------------------
        // Phases
        // --------------------------------------------------

        this.validatePhasesInternal(
            constraint,
            dto.phases,
            errors
        );

        // --------------------------------------------------
        // Themes
        // --------------------------------------------------

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


    async validateProjectContent(
        constraintId: string,
        title: string,
        summary?: string
    ): Promise<ValidationResult> {

        const constraint =
            await this.getConstraint(constraintId);

        const errors: string[] = [];

        this.validateTitleWords(
            constraint.titleWords,
            title,
            errors
        );

        this.validateSummaryWords(
            constraint.summaryWords,
            summary,
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
    ): Promise<ValidationResult> {

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
    ): Promise<ValidationResult> {

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
    ): Promise<ValidationResult> {

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

    private validateTitleWords(
        range: IRange | undefined,
        title: string,
        errors: string[]
    ): void {

        if (!range) {
            return;
        }

        const count = this.countWords(title);

        if (!matchesRange(range, count)) {
            errors.push(
                `Project title must contain between ${range.min} and ${range.max} words. Current count: ${count}.`
            );
        }
    }

    private validateSummaryWords(
        range: IRange | undefined,
        summary: string | undefined,
        errors: string[]
    ): void {

        if (!range) {
            return;
        }

        const count = this.countWords(summary ?? '');

        if (!matchesRange(range, count)) {
            errors.push(
                `Project summary must contain between ${range.min} and ${range.max} words. Current count: ${count}.`
            );
        }
    }


    private countWords(text: string): number {
        return text
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length;
    }

    private validateParticipants(
        range: IRange | undefined,
        count: number,
        errors: string[]
    ): void {

        if (range && !matchesRange(range, count)) {
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

        if (range && !matchesRange(range, count)) {
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

        if (range && !matchesRange(range, budget)) {
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

        if (range && !matchesRange(range, duration)) {
            errors.push(
                `Project duration must be between ${range.min} and ${range.max}. Current duration: ${duration}.`
            );
        }
    }


    private async validatePhasesInternal(
        constraint: IConstraint,
        phases: PhaseValidationInput[],
        errors: string[]
    ): Promise<void> {

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

            // ---------------------------------------------
            // Budget per phase
            // ---------------------------------------------
            if (
                constraint.budgetPerPhase &&
                !matchesRange(
                    constraint.budgetPerPhase,
                    phase.budget
                )
            ) {
                errors.push(
                    `Phase "${phase.title}" budget must be between ${constraint.budgetPerPhase.min} and ${constraint.budgetPerPhase.max}. Current budget: ${phase.budget}.`
                );
            }

            // ---------------------------------------------
            // Duration per phase
            // ---------------------------------------------
            if (
                constraint.durationPerPhase &&
                !matchesRange(
                    constraint.durationPerPhase,
                    phase.duration
                )
            ) {
                errors.push(
                    `Phase "${phase.title}" duration must be between ${constraint.durationPerPhase.min} and ${constraint.durationPerPhase.max}. Current duration: ${phase.duration}.`
                );
            }

            // ---------------------------------------------
            // Activities per phase
            // ---------------------------------------------
            if (
                constraint.activitiesPerPhase &&
                phase._id
            ) {
                const activityCount =
                    await this.activityRepo.countByPhase(
                        phase._id.toString()
                    );

                if (
                    !matchesRange(
                        constraint.activitiesPerPhase,
                        activityCount
                    )
                ) {
                    errors.push(
                        `Phase "${phase.title}" must contain between ${constraint.activitiesPerPhase.min} and ${constraint.activitiesPerPhase.max} activities. Current count: ${activityCount}.`
                    );
                }
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

        if (range && !matchesRange(range, count)) {
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