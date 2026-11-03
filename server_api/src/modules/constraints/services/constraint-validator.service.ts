
import mongoose from "mongoose";

import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import {
    IRange,
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

        const collaboratorsInput: CollaboratorValidationInput[] =
            collaborators.map(collab => ({
                _id: collab._id,
                member: collab.member.toString(),
            }));

        const componentsInput: ComponentValidationInput[] = components.map(
            comp => ({
                _id: comp._id,
                title: comp.title,
                contributors: comp.contributors.map(cont => cont.toString()),
            }),
        );

        return this.validateProject(constraint, {
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

            collaborators: collaboratorsInput,

            themes: projectDoc.themes.map(
                theme => theme.toString(),
            ),

            phases,
            activities,
            equipments,
            components: componentsInput,
        });
    }

    // =====================================================
    // VALIDATE COMPLETE PROJECT
    // =====================================================

    public async validateProject(
        constraint: IConstraint,
        dto: ConstraintValidationInput,
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
            ),

            // Collaborators
            Promise.resolve(
                this.validateCollaborators(
                    constraint,
                    dto.collaborators ?? [],
                ),
            ),

            // Phases
            Promise.resolve(
                this.validatePhases(
                    constraint,
                    dto.phases ?? [],
                ),
            ),

            // Activities
            Promise.resolve(
                this.validateActivities(
                    constraint,
                    dto.activities ?? [],
                ),
            ),

            // Equipments
            Promise.resolve(
                this.validateEquipments(
                    constraint,
                    dto.equipments ?? [],
                ),
            ),

            // Components
            Promise.resolve(
                this.validateComponents(
                    constraint,
                    dto.components ?? [],
                ),
            ),

            // Themes
            this.validateThemes(
                constraint,
                dto.themes,
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
    ): Promise<ValidationResult> {

        const errors: string[] = [];

        this.validateProjectTitle(
            constraint,
            title,
            errors,
        );

        this.validateProjectSummary(
            constraint,
            summary,
            errors,
        );

        this.validateKeywordCount(
            constraint,
            keywords.length,
            errors,
        );

        this.validateProjectObjectivesAndOutput(
            constraint,
            objectives,
            errors,
        );

        this.validateProjectBudget(
            constraint,
            totalBudget,
            errors,
        );

        this.validateProjectDuration(
            constraint,
            totalDuration,
            errors,
        );

        return this.createValidationResult(errors);
    }

    // =====================================================
    // COLLABORATORS VALIDATION
    // =====================================================

    public validateCollaborators(
        constraint: IConstraint,
        collaborators: CollaboratorValidationInput[],
    ): ValidationResult {

        const errors: string[] = [];

        if (
            constraint.participants &&
            !checkRange(
                constraint.participants,
                collaborators.length,
            )
        ) {
            errors.push(
                `Collaborators must be between ${constraint.participants.min} and ${constraint.participants.max}. Current count: ${collaborators.length}.`,
            );
        }

        return this.createValidationResult(errors);
    }

    // =====================================================
    // PHASES VALIDATION
    // =====================================================

    public validatePhases(
        constraint: IConstraint,
        phases: PhaseValidationInput[],
    ): ValidationResult {

        const errors: string[] = [];

        // Total number of phases
        if (
            constraint.phases &&
            !checkRange(
                constraint.phases,
                phases.length,
            )
        ) {
            errors.push(
                `Number of phases must be between ${constraint.phases.min} and ${constraint.phases.max}. Current count: ${phases.length}.`,
            );
        }

        phases.forEach(phase => {

            // Phase budget
            if (
                constraint.phaseBudget &&
                !checkRange(
                    constraint.phaseBudget,
                    phase.budget,
                )
            ) {
                errors.push(
                    `Phase "${phase.title}" budget must be between ${constraint.phaseBudget.min} and ${constraint.phaseBudget.max}. Current budget: ${phase.budget}.`,
                );
            }

            // Phase duration
            if (
                constraint.phaseDuration &&
                !checkRange(
                    constraint.phaseDuration,
                    phase.duration,
                )
            ) {
                errors.push(
                    `Phase "${phase.title}" duration must be between ${constraint.phaseDuration.min} and ${constraint.phaseDuration.max}. Current duration: ${phase.duration}.`,
                );
            }
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // ACTIVITIES VALIDATION
    // =====================================================

    public validateActivities(
        constraint: IConstraint,
        activities: ActivityValidationInput[],
    ): ValidationResult {

        const errors: string[] = [];

        // Total number of activities
        if (
            constraint.activities &&
            !checkRange(
                constraint.activities,
                activities.length,
            )
        ) {
            errors.push(
                `Number of activities must be between ${constraint.activities.min} and ${constraint.activities.max}. Current count: ${activities.length}.`,
            );
        }

        activities.forEach(activity => {

            // Activity cost
            if (
                constraint.activityCost &&
                !checkRange(
                    constraint.activityCost,
                    activity.cost,
                )
            ) {
                errors.push(
                    `Activity "${activity.title}" cost must be between ${constraint.activityCost.min} and ${constraint.activityCost.max}. Current cost: ${activity.cost}.`,
                );
            }

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

                if (
                    !checkRange(
                        constraint.activityDuration,
                        duration,
                    )
                ) {
                    errors.push(
                        `Activity "${activity.title}" duration must be between ${constraint.activityDuration.min} and ${constraint.activityDuration.max} days. Current duration: ${duration} days.`,
                    );
                }
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
    ): ValidationResult {

        const errors: string[] = [];

        // Equipment count
        if (
            constraint.equipments &&
            !checkRange(
                constraint.equipments,
                equipments.length,
            )
        ) {
            errors.push(
                `Number of equipments must be between ${constraint.equipments.min} and ${constraint.equipments.max}. Current count: ${equipments.length}.`,
            );
        }

        // Cost per equipment
        if (constraint.equipmentCost) {

            equipments.forEach(equipment => {


                if (
                    !checkRange(
                        constraint.equipmentCost!,
                        equipment.quantity * equipment.unitPrice,
                    )
                ) {
                    errors.push(
                        `Equipment "${equipment.itemName}" cost must be between ${constraint.equipmentCost!.min} and ${constraint.equipmentCost!.max}. Current cost: ${equipment.quantity * equipment.unitPrice}.`,
                    );
                }
            });
        }

        return this.createValidationResult(errors);
    }

    // =====================================================
    // COMPONENTS VALIDATION
    // =====================================================

    public validateComponents(
        constraint: IConstraint,
        components: ComponentValidationInput[],
    ): ValidationResult {

        const errors: string[] = [];

        // Number of components
        if (
            constraint.components &&
            !checkRange(
                constraint.components,
                components.length,
            )
        ) {
            errors.push(
                `Number of components must be between ${constraint.components.min} and ${constraint.components.max}. Current count: ${components.length}.`,
            );
        }

        // Contributors per component
        if (constraint.componentCollaborators) {

            components.forEach(component => {

                const count =
                    component.contributors.length;

                if (
                    !checkRange(
                        constraint.componentCollaborators!,
                        count,
                    )
                ) {
                    errors.push(
                        `Component "${component.title}" must have between ${constraint.componentCollaborators!.min} and ${constraint.componentCollaborators!.max} collaborators. Current count: ${count}.`,
                    );
                }
            });
        }

        return this.createValidationResult(errors);
    }

    // =====================================================
    // THEMES VALIDATION
    // =====================================================

    public async validateThemes(
        constraint: IConstraint,
        themes: string[],
    ): Promise<ValidationResult> {

        const errors: string[] = [];

        const counts =
            await this.countThemeLevels(themes);

        this.validateThemeLevel(
            "Theme",
            counts[0]?.size ?? 0,
            constraint.themes,
            errors,
        );

        this.validateThemeLevel(
            "Sub-theme",
            counts[1]?.size ?? 0,
            constraint.subThemes,
            errors,
        );

        this.validateThemeLevel(
            "Focus Area",
            counts[2]?.size ?? 0,
            constraint.focusAreas,
            errors,
        );

        this.validateThemeLevel(
            "Indicator",
            counts[3]?.size ?? 0,
            constraint.indicators,
            errors,
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
    ): void {

        if (!constraint.titleWords) {
            return;
        }

        const count = countWords(title);

        if (
            !checkRange(
                constraint.titleWords,
                count,
            )
        ) {
            errors.push(
                `Project title must contain between ${constraint.titleWords.min} and ${constraint.titleWords.max} words. Current count: ${count}.`,
            );
        }
    }

    // =====================================================
    // PROJECT SUMMARY VALIDATION
    // =====================================================

    public validateProjectSummary(
        constraint: IConstraint,
        summary: string | undefined,
        errors: string[],
    ): void {

        if (!constraint.summaryWords) {
            return;
        }

        const count = countWords(summary ?? "");

        if (
            !checkRange(
                constraint.summaryWords,
                count,
            )
        ) {
            errors.push(
                `Project summary must contain between ${constraint.summaryWords.min} and ${constraint.summaryWords.max} words. Current count: ${count}.`,
            );
        }
    }

    // =====================================================
    // KEYWORD VALIDATION
    // =====================================================

    public validateKeywordCount(
        constraint: IConstraint,
        count: number,
        errors: string[],
    ): void {

        const keywordRange = constraint.keyWords;

        if (
            keywordRange &&
            !checkRange(keywordRange, count)
        ) {
            errors.push(
                `Number of keywords must be between ${keywordRange.min} and ${keywordRange.max}. Current count: ${count}.`,
            );
        }
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
    ): void {

        if (!objectives) {
            return;
        }

        // General objective
        this.validateGeneralObjective(
            constraint,
            objectives.general,
            errors,
        );

        // Specific objectives
        this.validateSpecificObjectives(
            constraint,
            objectives.specific ?? [],
            errors,
        );

        // Expected outputs
        this.validateExpectedOutputs(
            constraint,
            objectives.expectedOutputs ?? [],
            errors,
        );
    }

    private validateGeneralObjective(
        constraint: IConstraint,
        generalObjective: string | undefined,
        errors: string[],
    ): void {

        if (!constraint.generalObjectiveWords) {
            return;
        }

        const count = countWords(
            generalObjective ?? "",
        );

        if (
            !checkRange(
                constraint.generalObjectiveWords,
                count,
            )
        ) {
            errors.push(
                `General objective must contain between ${constraint.generalObjectiveWords.min} and ${constraint.generalObjectiveWords.max} words. Current count: ${count}.`,
            );
        }
    }

    private validateSpecificObjectives(
        constraint: IConstraint,
        specificObjectives: string[],
        errors: string[],
    ): void {

        // Number of specific objectives
        const objectiveRange =
            constraint.specificObjectives;

        if (
            objectiveRange &&
            !checkRange(
                objectiveRange,
                specificObjectives.length,
            )
        ) {
            errors.push(
                `Number of specific objectives must be between ${objectiveRange.min} and ${objectiveRange.max}. Current count: ${specificObjectives.length}.`,
            );
        }

        // Word count of each specific objective
        const wordRange =
            constraint.specificObjectiveWords;

        if (wordRange) {

            specificObjectives.forEach(
                (objective, index) => {

                    const count = countWords(
                        objective ?? "",
                    );

                    if (
                        !checkRange(
                            wordRange,
                            count,
                        )
                    ) {
                        errors.push(
                            `Specific objective ${index + 1} must contain between ${wordRange.min} and ${wordRange.max} words. Current count: ${count}.`,
                        );
                    }
                },
            );
        }
    }

    private validateExpectedOutputs(
        constraint: IConstraint,
        expectedOutputs: string[],
        errors: string[],
    ): void {

        // Number of expected outputs
        const outputRange =
            constraint.expectedOutputs;

        if (
            outputRange &&
            !checkRange(
                outputRange,
                expectedOutputs.length,
            )
        ) {
            errors.push(
                `Number of expected outputs must be between ${outputRange.min} and ${outputRange.max}. Current count: ${expectedOutputs.length}.`,
            );
        }

        // Word count of each expected output
        const wordRange =
            constraint.expectedOutputWords;

        if (wordRange) {

            expectedOutputs.forEach(
                (output, index) => {

                    const count = countWords(
                        output ?? "",
                    );

                    if (
                        !checkRange(
                            wordRange,
                            count,
                        )
                    ) {
                        errors.push(
                            `Expected output ${index + 1} must contain between ${wordRange.min} and ${wordRange.max} words. Current count: ${count}.`,
                        );
                    }
                },
            );
        }
    }

    // =====================================================
    // PROJECT BUDGET VALIDATION
    // =====================================================

    public validateProjectBudget(
        constraint: IConstraint,
        budget: number,
        errors: string[],
    ): void {

        const budgetRange = constraint.budget;

        if (
            budgetRange &&
            !checkRange(
                budgetRange,
                budget,
            )
        ) {
            errors.push(
                `Project budget must be between ${budgetRange.min} and ${budgetRange.max}. Current budget: ${budget}.`,
            );
        }
    }

    // =====================================================
    // PROJECT DURATION VALIDATION
    // =====================================================

    public validateProjectDuration(
        constraint: IConstraint,
        duration: number,
        errors: string[],
    ): void {

        const durationRange = constraint.duration;

        if (
            durationRange &&
            !checkRange(
                durationRange,
                duration,
            )
        ) {
            errors.push(
                `Project duration must be between ${durationRange.min} and ${durationRange.max}. Current duration: ${duration}.`,
            );
        }
    }

    // =====================================================
    // PRIVATE THEME HELPERS
    // =====================================================

    private validateThemeLevel(
        label: string,
        count: number,
        range: IRange | undefined,
        errors: string[],
    ): void {

        if (
            range &&
            !checkRange(range, count)
        ) {
            errors.push(
                `${label} count must be between ${range.min} and ${range.max}. Current count: ${count}.`,
            );
        }
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
