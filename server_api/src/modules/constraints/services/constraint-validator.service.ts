import mongoose from "mongoose";

import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import {
    IRange,
    RangeCheck,
    checkRange,
} from "../../../common/types/range";
import { calculateDurationDays } from "../../../common/utils/date.utils";

import { PhaseActivityRepository } from "../../projects/activities/phase-activity.repository";
import { CollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { ProjectComponentRepository } from "../../projects/components/component.repository";
import { PhaseEquipmentRepository } from "../../projects/equipments/phase-equipment.repository";
import { PhaseRepository } from "../../projects/phase/phase.repository";
import { ProjectRepository } from "../../projects/project.repository";
import { ThemeRepository } from "../../thematics/themes/theme.repository";

import { PhaseDto } from "../../projects/phase/phase.dto";

import { PhaseActivityDto } from "../../projects/activities/phase-activity.dto";
import { ProjectComponentDto } from "../../projects/components/component.dto";
import { EquipmentDto } from "../../projects/equipments/phase-equipment.dto";
import { IConstraint } from "../constraint.model";
import { ConstraintRepository } from "../constraint.repository";
import { CollaboratorDto } from "../../projects/collaborators/collaborator.dto";

// =====================================================
// TYPES
// =====================================================

export function countWords(text: string): number {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .length;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Controls which side of a range is enforced.
 * By default (both false/undefined) the min AND the max are checked.
 *
 *  - skipMin: ignore "below" violations (only enforce the max)
 *  - skipMax: ignore "above" violations (only enforce the min)
 */
export interface ValidationOptions {
    skipMin?: boolean;
    skipMax?: boolean;
}

export type CollaboratorValidationInput = Pick<
    CollaboratorDto,
    "member"
> & {
    _id?: string | mongoose.Types.ObjectId;
};

export type PhaseValidationInput = Pick<
    PhaseDto,
    "title" | "budget" | "duration"
> & {
    _id?: string | mongoose.Types.ObjectId;
};

export type ActivityValidationInput = Pick<
    PhaseActivityDto,
    "title" | "cost" | "startDate" | "endDate"
> & {
    _id?: string | mongoose.Types.ObjectId;
};

export type EquipmentValidationInput = Pick<
    EquipmentDto,
    "itemName" | "unitPrice" | "quantity"
> & {
    _id?: string | mongoose.Types.ObjectId;
};

export type ComponentValidationInput = Pick<
    ProjectComponentDto,
    "title" | "contributors"
> & {
    _id?: string | mongoose.Types.ObjectId;
};


export function toCollaboratorValidationInput<
    T extends { _id?: string | mongoose.Types.ObjectId; member: any }
>(
    items: T[],
) {
    return items.map(item => ({
        ...(item._id && { _id: item._id }),
        member: item.member.toString(),
    }));
}

export interface ConstraintValidationInput {
    title: string;
    summary?: string;
    keywords?: string[];

    totalBudget: number;
    totalDuration: number;

    themes: string[];

    objectives?: {
        general?: string;
        specific?: string[];
        expectedOutputs?: string[];
    };

    collaborators?: CollaboratorValidationInput[];
    phases?: PhaseValidationInput[];
    activities?: ActivityValidationInput[];
    equipments?: EquipmentValidationInput[];
    components?: ComponentValidationInput[];
}

// =====================================================
// SERVICE
// =====================================================

export class ConstraintValidationService {

    constructor(
        private readonly constraintRepo: ConstraintRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly themeRepo: ThemeRepository,
        private readonly collaboratorRepo: CollaboratorRepository,
        private readonly phaseRepo: PhaseRepository,
        private readonly activityRepo: PhaseActivityRepository,
        private readonly equipmentRepo: PhaseEquipmentRepository,
        private readonly componentRepo: ProjectComponentRepository,
    ) { }

    // =====================================================
    // COMMON HELPERS
    // =====================================================

    private createValidationResult(
        errors: string[],
    ): ValidationResult {
        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Runs checkRange and then discards the side(s) the caller asked to skip.
     */
    private evaluateRange(
        range: IRange,
        value: number,
        options: ValidationOptions = {},
    ): RangeCheck {

        const result = checkRange(range, value);

        if (result === "below" && options.skipMin) {
            return "ok";
        }

        if (result === "above" && options.skipMax) {
            return "ok";
        }

        return result;
    }

    /**
     * Validates a value against an optional range and pushes a
     * direction-specific error message ("at least" / "must not exceed").
     *
     * @param subject Text that starts the message, e.g. `Number of phases`
     * @param unit    Optional unit appended to the numbers, e.g. `days`
     */
    private validateRange(
        errors: string[],
        range: IRange | undefined,
        value: number,
        subject: string,
        options: ValidationOptions = {},
        unit: string = "",
    ): void {

        if (!range) {
            return;
        }

        const result = this.evaluateRange(
            range,
            value,
            options,
        );

        if (result === "ok") {
            return;
        }

        const suffix = unit ? ` ${unit}` : "";

        if (result === "below") {
            errors.push(
                `${subject} must be at least ${range.min}${suffix}. Current: ${value}${suffix}.`,
            );
            return;
        }

        errors.push(
            `${subject} must not exceed ${range.max}${suffix}. Current: ${value}${suffix}.`,
        );
    }

    // =====================================================
    // CONSTRAINT
    // =====================================================

    public async getConstraint(
        constraintId: string,
    ): Promise<IConstraint> {

        const constraint =
            await this.constraintRepo.findById(constraintId);

        if (!constraint) {
            throw new AppError(
                ERROR_CODES.CONSTRAINT_NOT_FOUND,
            );
        }

        return constraint;
    }

    // =====================================================
    // VALIDATE PROJECT BY ID
    // =====================================================

    public async validateProjectById(
        constraint: IConstraint,
        projectId: string,
        options: ValidationOptions = {},
    ): Promise<ValidationResult> {

        const projectDoc =
            await this.projectRepo.findById(projectId);

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND,
            );
        }

        const [
            collaborators,
            phases,
            activities,
            equipments,
            components,
        ] = await Promise.all([
            this.collaboratorRepo.find({
                project: projectId,
            }),

            this.phaseRepo.find({
                project: projectId,
            }),

            this.activityRepo.find({
                project: projectId,
            }),

            this.equipmentRepo.find({
                project: projectId,
            }),

            this.componentRepo.find({
                project: projectId,
            }),
        ]);


        const componentsInput: ComponentValidationInput[] = components.map(
            comp => ({
                _id: comp._id,
                title: comp.title,
                contributors: comp.contributors.map(cont => cont.toString()),
            }),
        );

        return this.validateProject(
            constraint,
            {
                title: projectDoc.title,
                summary: projectDoc.summary,

                totalBudget: projectDoc.totalBudget ?? 0,
                totalDuration: projectDoc.totalDuration ?? 0,

                objectives: {
                    general: projectDoc.objectives?.general,
                    specific:
                        projectDoc.objectives?.specific ?? [],
                    expectedOutputs:
                        projectDoc.objectives?.expectedOutputs ?? [],
                },

                collaborators: toCollaboratorValidationInput(collaborators),

                themes: projectDoc.themes.map(
                    theme => theme.toString(),
                ),

                phases,
                activities,
                equipments,
                components: componentsInput,
            },
            options,
        );
    }

    // =====================================================
    // VALIDATE COMPLETE PROJECT
    // =====================================================

    public async validateProject(
        constraint: IConstraint,
        dto: ConstraintValidationInput,
        options: ValidationOptions = {},
    ): Promise<ValidationResult> {

        const results = await Promise.all([

            // Project content
            this.validateProjectContent(
                constraint,
                dto.title,
                dto.summary,
                dto.totalBudget ?? 0,
                dto.totalDuration ?? 0,
                dto.objectives,
                dto.keywords ?? [],
                options,
            ),

            // Collaborators
            Promise.resolve(
                this.validateCollaborators(
                    constraint,
                    dto.collaborators ?? [],
                    options,
                ),
            ),

            // Phases
            Promise.resolve(
                this.validatePhases(
                    constraint,
                    dto.phases ?? [],
                    options,
                ),
            ),

            // Activities
            Promise.resolve(
                this.validateActivities(
                    constraint,
                    dto.activities ?? [],
                    options,
                ),
            ),

            // Equipments
            Promise.resolve(
                this.validateEquipments(
                    constraint,
                    dto.equipments ?? [],
                    options,
                ),
            ),

            // Components
            Promise.resolve(
                this.validateComponents(
                    constraint,
                    dto.components ?? [],
                    options,
                ),
            ),

            // Themes
            this.validateThemes(
                constraint,
                dto.themes,
                options,
            ),
        ]);

        const errors = results.flatMap(
            result => result.errors,
        );

        return this.createValidationResult(errors);
    }

    // =====================================================
    // PROJECT CONTENT VALIDATION
    // =====================================================

    public async validateProjectContent(
        constraint: IConstraint,
        title: string,
        summary?: string,
        totalBudget: number = 0,
        totalDuration: number = 0,
        objectives?: {
            general?: string;
            specific?: string[];
            expectedOutputs?: string[];
        },
        keywords: string[] = [],
        options: ValidationOptions = {},
    ): Promise<ValidationResult> {

        const errors: string[] = [];

        this.validateProjectTitle(
            constraint,
            title,
            errors,
            options,
        );

        this.validateProjectSummary(
            constraint,
            summary,
            errors,
            options,
        );

        this.validateKeywordCount(
            constraint,
            keywords.length,
            errors,
            options,
        );

        this.validateProjectObjectivesAndOutput(
            constraint,
            objectives,
            errors,
            options,
        );

        this.validateProjectBudget(
            constraint,
            totalBudget,
            errors,
            options,
        );

        this.validateProjectDuration(
            constraint,
            totalDuration,
            errors,
            options,
        );

        return this.createValidationResult(errors);
    }

    // =====================================================
    // COLLABORATORS VALIDATION
    // =====================================================

    public validateCollaborators(
        constraint: IConstraint,
        collaborators: CollaboratorValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];

        this.validateRange(
            errors,
            constraint.participants,
            collaborators.length,
            "Number of collaborators",
            options,
        );

        return this.createValidationResult(errors);
    }

    // =====================================================
    // PHASES VALIDATION
    // =====================================================

    public validatePhases(
        constraint: IConstraint,
        phases: PhaseValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];

        // Total number of phases
        this.validateRange(
            errors,
            constraint.phases,
            phases.length,
            "Number of phases",
            options,
        );

        phases.forEach(phase => {

            // Phase budget
            this.validateRange(
                errors,
                constraint.phaseBudget,
                phase.budget,
                `Phase "${phase.title}" budget`,
                options,
            );

            // Phase duration
            this.validateRange(
                errors,
                constraint.phaseDuration,
                phase.duration,
                `Phase "${phase.title}" duration`,
                options,
            );
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // ACTIVITIES VALIDATION
    // =====================================================

    public validateActivities(
        constraint: IConstraint,
        activities: ActivityValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];

        // Total number of activities
        this.validateRange(
            errors,
            constraint.activities,
            activities.length,
            "Number of activities",
            options,
        );

        activities.forEach(activity => {

            // Activity cost
            this.validateRange(
                errors,
                constraint.activityCost,
                activity.cost,
                `Activity "${activity.title}" cost`,
                options,
            );

            // Activity duration
            if (constraint.activityDuration) {

                if (
                    !activity.startDate ||
                    !activity.endDate
                ) {
                    errors.push(
                        `Activity "${activity.title}" must have both start and end dates to validate its duration.`,
                    );

                    return;
                }

                const duration = calculateDurationDays(
                    activity.startDate,
                    activity.endDate,
                );

                this.validateRange(
                    errors,
                    constraint.activityDuration,
                    duration,
                    `Activity "${activity.title}" duration`,
                    options,
                    "days",
                );
            }
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // EQUIPMENTS VALIDATION
    // =====================================================

    public validateEquipments(
        constraint: IConstraint,
        equipments: EquipmentValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];

        // Equipment count
        this.validateRange(
            errors,
            constraint.equipments,
            equipments.length,
            "Number of equipments",
            options,
        );

        // Cost per equipment
        equipments.forEach(equipment => {

            this.validateRange(
                errors,
                constraint.equipmentCost,
                equipment.quantity * equipment.unitPrice,
                `Equipment "${equipment.itemName}" cost`,
                options,
            );
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // COMPONENTS VALIDATION
    // =====================================================

    public validateComponents(
        constraint: IConstraint,
        components: ComponentValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];

        // Number of components
        this.validateRange(
            errors,
            constraint.components,
            components.length,
            "Number of components",
            options,
        );

        // Contributors per component
        components.forEach(component => {

            this.validateRange(
                errors,
                constraint.componentCollaborators,
                component.contributors.length,
                `Number of collaborators in component "${component.title}"`,
                options,
            );
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // THEMES VALIDATION
    // =====================================================

    public async validateThemes(
        constraint: IConstraint,
        themes: string[],
        options: ValidationOptions = {},
    ): Promise<ValidationResult> {

        const errors: string[] = [];

        const counts =
            await this.countThemeLevels(themes);

        this.validateThemeLevel(
            "Theme",
            counts[0]?.size ?? 0,
            constraint.themes,
            errors,
            options,
        );

        this.validateThemeLevel(
            "Sub-theme",
            counts[1]?.size ?? 0,
            constraint.subThemes,
            errors,
            options,
        );

        this.validateThemeLevel(
            "Focus Area",
            counts[2]?.size ?? 0,
            constraint.focusAreas,
            errors,
            options,
        );

        this.validateThemeLevel(
            "Indicator",
            counts[3]?.size ?? 0,
            constraint.indicators,
            errors,
            options,
        );

        return this.createValidationResult(errors);
    }

    // =====================================================
    // PROJECT TITLE VALIDATION
    // =====================================================

    public validateProjectTitle(
        constraint: IConstraint,
        title: string,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        this.validateRange(
            errors,
            constraint.titleWords,
            countWords(title),
            "Project title word count",
            options,
            "words",
        );
    }

    // =====================================================
    // PROJECT SUMMARY VALIDATION
    // =====================================================

    public validateProjectSummary(
        constraint: IConstraint,
        summary: string | undefined,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        this.validateRange(
            errors,
            constraint.summaryWords,
            countWords(summary ?? ""),
            "Project summary word count",
            options,
            "words",
        );
    }

    // =====================================================
    // KEYWORD VALIDATION
    // =====================================================

    public validateKeywordCount(
        constraint: IConstraint,
        count: number,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        this.validateRange(
            errors,
            constraint.keyWords,
            count,
            "Number of keywords",
            options,
        );
    }

    // =====================================================
    // OBJECTIVES AND EXPECTED OUTPUTS VALIDATION
    // =====================================================

    public validateProjectObjectivesAndOutput(
        constraint: IConstraint,
        objectives: {
            general?: string;
            specific?: string[];
            expectedOutputs?: string[];
        } | undefined,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        if (!objectives) {
            return;
        }

        // General objective
        this.validateGeneralObjective(
            constraint,
            objectives.general,
            errors,
            options,
        );

        // Specific objectives
        this.validateSpecificObjectives(
            constraint,
            objectives.specific ?? [],
            errors,
            options,
        );

        // Expected outputs
        this.validateExpectedOutputs(
            constraint,
            objectives.expectedOutputs ?? [],
            errors,
            options,
        );
    }

    private validateGeneralObjective(
        constraint: IConstraint,
        generalObjective: string | undefined,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        this.validateRange(
            errors,
            constraint.generalObjectiveWords,
            countWords(generalObjective ?? ""),
            "General objective word count",
            options,
            "words",
        );
    }

    private validateSpecificObjectives(
        constraint: IConstraint,
        specificObjectives: string[],
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        // Number of specific objectives
        this.validateRange(
            errors,
            constraint.specificObjectives,
            specificObjectives.length,
            "Number of specific objectives",
            options,
        );

        // Word count of each specific objective
        specificObjectives.forEach(
            (objective, index) => {

                this.validateRange(
                    errors,
                    constraint.specificObjectiveWords,
                    countWords(objective ?? ""),
                    `Specific objective ${index + 1} word count`,
                    options,
                    "words",
                );
            },
        );
    }

    private validateExpectedOutputs(
        constraint: IConstraint,
        expectedOutputs: string[],
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        // Number of expected outputs
        this.validateRange(
            errors,
            constraint.expectedOutputs,
            expectedOutputs.length,
            "Number of expected outputs",
            options,
        );

        // Word count of each expected output
        expectedOutputs.forEach(
            (output, index) => {

                this.validateRange(
                    errors,
                    constraint.expectedOutputWords,
                    countWords(output ?? ""),
                    `Expected output ${index + 1} word count`,
                    options,
                    "words",
                );
            },
        );
    }

    // =====================================================
    // PROJECT BUDGET VALIDATION
    // =====================================================

    public validateProjectBudget(
        constraint: IConstraint,
        budget: number,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        this.validateRange(
            errors,
            constraint.budget,
            budget,
            "Project budget",
            options,
        );
    }

    // =====================================================
    // PROJECT DURATION VALIDATION
    // =====================================================

    public validateProjectDuration(
        constraint: IConstraint,
        duration: number,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        this.validateRange(
            errors,
            constraint.duration,
            duration,
            "Project duration",
            options,
        );
    }

    // =====================================================
    // PRIVATE THEME HELPERS
    // =====================================================

    private validateThemeLevel(
        label: string,
        count: number,
        range: IRange | undefined,
        errors: string[],
        options: ValidationOptions = {},
    ): void {

        this.validateRange(
            errors,
            range,
            count,
            `${label} count`,
            options,
        );
    }

    private async countThemeLevels(
        selectedThemes: string[],
    ): Promise<Record<number, Set<string>>> {

        const levels: Record<number, Set<string>> = {};

        for (const id of selectedThemes) {

            let current =
                await this.themeRepo.findById(id);

            if (!current) {
                throw new AppError(
                    ERROR_CODES.THEME_NOT_FOUND,
                );
            }

            while (current) {

                if (!levels[current.level]) {
                    levels[current.level] = new Set();
                }

                levels[current.level].add(
                    current._id.toString(),
                );

                if (!current.parent) {
                    break;
                }

                current =
                    await this.themeRepo.findById(
                        current.parent.toString(),
                    );
            }
        }

        return levels;
    }
}