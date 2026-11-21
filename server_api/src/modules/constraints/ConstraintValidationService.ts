import { IRange, checkRange } from "../../common/types/range";
import { IConstraint } from "./constraint.model";
import { calculateDurationDays } from "../../common/utils/date.utils";
import { ConstraintRepository } from "./constraint.repository";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import mongoose from "mongoose";
import { GrantRepository } from "../grants/grant.repository";

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export interface ValidationOptions {
    skipMin?: boolean;
    skipMax?: boolean;
}

// =====================================================
// INPUT TYPES
// =====================================================

// Project
export interface ProjectInput {
    title: string;
    summary: string;
    keywords: string[];

    totalBudget: number;
    totalDuration: number;

    themes: string[];

    objectives: {
        general: string;
        specific: string[];
        expectedOutputs: string[];
    };
}

// Collaborators
export interface CollaboratorValidationInput {
    members: number;
}

// Phase
export interface PhaseValidationInput {
    _id?: string | mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    budget: number;
    order?: number;
}

// Activity
export interface ActivityValidationInput {
    _id?: string | mongoose.Types.ObjectId;
    phase?: string;
    title: string;
    cost: number;
    startDate: Date;
    endDate: Date;
}

// Equipment
export interface EquipmentValidationInput {
    itemName: string;
    quantity: number;
    unitPrice: number;
}

// Component
export interface ComponentValidationInput {
    name: string;
    collaborators: number;
}

// All sections at once
export interface AllValidationInput {
    project: ProjectInput;
    collaborators: CollaboratorValidationInput;
    phases: PhaseValidationInput[];
    activities: ActivityValidationInput[];
    equipments: EquipmentValidationInput[];
    components: ComponentValidationInput[];
}

// =====================================================
// SERVICE
// =====================================================

export class ConstraintValidationService {

    constructor(
        private readonly constraintRepo: ConstraintRepository,
        private readonly grantRepo: GrantRepository,
    ) { }

    // =====================================================
    // CONSTRAINT DB
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


    public async getConstraintByGrant(
        grantId: string,
    ): Promise<IConstraint | null> {

        const grantDoc = await this.grantRepo.findById(
            grantId
        );

        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        if (!grantDoc.constraint) return null;

        const constraint =
            await this.constraintRepo.findById(grantId);

        if (!constraint) {
            throw new AppError(
                ERROR_CODES.CONSTRAINT_NOT_FOUND,
            );
        }

        return constraint;
    }

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

    private countWords(text: string): number {
        return text.trim().split(/\s+/).filter(Boolean).length;
    }

    private validateRange(
        errors: string[],
        range: IRange | undefined,
        value: number,
        subject: string,
        options: ValidationOptions = {},
        unit = "",
    ): void {

        if (!range) return;

        const result = checkRange(range, value);

        if (result === "ok") return;
        if (result === "below" && options.skipMin) return;
        if (result === "above" && options.skipMax) return;

        const suffix = unit ? ` ${unit}` : "";

        if (result === "below") {
            errors.push(
                `${subject} must be at least ${range.min}${suffix}. Current: ${value}${suffix}.`,
            );
        } else {
            errors.push(
                `${subject} must not exceed ${range.max}${suffix}. Current: ${value}${suffix}.`,
            );
        }
    }

    // =====================================================
    // PROJECT VALIDATION
    // =====================================================

    public validateProject(
        constraint: IConstraint,
        project: ProjectInput,
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];
        const rules = constraint.projectConstraints;

        if (!rules) return this.createValidationResult(errors);

        // Title
        this.validateRange(
            errors,
            rules.titleWords,
            this.countWords(project.title),
            "Project title word count",
            options,
            "words",
        );

        // Summary
        this.validateRange(
            errors,
            rules.summaryWords,
            this.countWords(project.summary),
            "Project summary word count",
            options,
            "words",
        );

        // Keywords
        this.validateRange(
            errors,
            rules.keyWords,
            project.keywords.length,
            "Number of keywords",
            options,
        );

        // General objective
        this.validateRange(
            errors,
            rules.generalObjectiveWords,
            this.countWords(project.objectives.general),
            "General objective word count",
            options,
            "words",
        );

        // Specific objectives
        this.validateRange(
            errors,
            rules.specificObjectives,
            project.objectives.specific.length,
            "Number of specific objectives",
            options,
        );

        project.objectives.specific.forEach((objective, index) => {
            this.validateRange(
                errors,
                rules.specificObjectiveWords,
                this.countWords(objective),
                `Specific objective ${index + 1} word count`,
                options,
                "words",
            );
        });

        // Expected outputs
        this.validateRange(
            errors,
            rules.expectedOutputs,
            project.objectives.expectedOutputs.length,
            "Number of expected outputs",
            options,
        );

        project.objectives.expectedOutputs.forEach((output, index) => {
            this.validateRange(
                errors,
                rules.expectedOutputWords,
                this.countWords(output),
                `Expected output ${index + 1} word count`,
                options,
                "words",
            );
        });

        // Project budget
        this.validateRange(
            errors,
            rules.budget,
            project.totalBudget,
            "Project budget",
            options,
        );

        // Project duration
        this.validateRange(
            errors,
            rules.duration,
            project.totalDuration,
            "Project duration",
            options,
            "days",
        );

        // Themes
        this.validateRange(
            errors,
            rules.themes,
            project.themes.length,
            "Number of themes",
            options,
        );

        return this.createValidationResult(errors);
    }

    // =====================================================
    // COLLABORATOR VALIDATION
    // =====================================================

    public validateCollaborators(
        constraint: IConstraint,
        collaborators: CollaboratorValidationInput,
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];

        this.validateRange(
            errors,
            constraint.collaboratorConstraints?.members,
            collaborators.members,
            "Number of collaborators",
            options,
        );

        return this.createValidationResult(errors);
    }

    // =====================================================
    // PHASE VALIDATION
    // =====================================================

    public validatePhases(
        constraint: IConstraint,
        phases: PhaseValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];
        const rules = constraint.phaseConstraints;

        if (!rules) return this.createValidationResult(errors);

        // Number of phases
        this.validateRange(
            errors,
            rules.phases,
            phases.length,
            "Number of phases",
            options,
        );

        phases.forEach((phase, index) => {

            const phaseName = `Phase ${index + 1}`;

            // Phase budget
            this.validateRange(
                errors,
                rules.budget,
                phase.budget,
                `${phaseName} budget`,
                undefined,
                "Birr"
            );

            // Phase duration
            const duration = calculateDurationDays(
                phase.startDate,
                phase.endDate,
            );

            this.validateRange(
                errors,
                rules.duration,
                duration,
                `${phaseName} duration`,
                undefined,
                "days",
            );
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // ACTIVITY VALIDATION
    // =====================================================

    public validateActivities(
        constraint: IConstraint,
        activities: ActivityValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];
        const rules = constraint.activityConstraints;

        if (!rules) return this.createValidationResult(errors);

        // Number of activities
        this.validateRange(
            errors,
            rules.activities,
            activities.length,
            "Number of activities",
            options,
        );

        activities.forEach(activity => {

            // Activity cost
            this.validateRange(
                errors,
                rules.cost,
                activity.cost,
                `Activity "${activity.title}" cost`,
                undefined,
                "Birr"
            );

            // Activity duration
            const duration = calculateDurationDays(
                activity.startDate,
                activity.endDate,
            );

            this.validateRange(
                errors,
                rules.duration,
                duration,
                `Activity "${activity.title}" duration`,
                undefined,
                "days",
            );
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // EQUIPMENT VALIDATION
    // =====================================================

    public validateEquipments(
        constraint: IConstraint,
        equipments: EquipmentValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];
        const rules = constraint.equipmentConstraints;

        if (!rules) return this.createValidationResult(errors);

        // Number of equipment items
        this.validateRange(
            errors,
            rules.equipments,
            equipments.length,
            "Number of equipments",
            options,
        );

        equipments.forEach(equipment => {

            // Equipment total cost
            const totalCost = equipment.quantity * equipment.unitPrice;

            this.validateRange(
                errors,
                rules.cost,
                totalCost,
                `Equipment "${equipment.itemName}" cost`,
                undefined,
                "Birr"
            );
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // COMPONENT VALIDATION
    // =====================================================

    public validateComponents(
        constraint: IConstraint,
        components: ComponentValidationInput[],
        options: ValidationOptions = {},
    ): ValidationResult {

        const errors: string[] = [];
        const rules = constraint.componentConstraints;

        if (!rules) return this.createValidationResult(errors);

        // Number of components
        this.validateRange(
            errors,
            rules.components,
            components.length,
            "Number of components",
            options,
        );

        components.forEach(component => {

            // Collaborators per component
            this.validateRange(
                errors,
                rules.collaborators,
                component.collaborators,
                `Number of collaborators in component "${component.name}"`,
                options,
            );
        });

        return this.createValidationResult(errors);
    }

    // =====================================================
    // ALL SECTIONS VALIDATION
    // =====================================================

    public validateAll(
        constraint: IConstraint,
        dto: AllValidationInput,
        options: ValidationOptions = {},
    ): ValidationResult {

        const results = [
            this.validateProject(constraint, dto.project, options),
            this.validateCollaborators(constraint, dto.collaborators, options),
            this.validatePhases(constraint, dto.phases, options),
            this.validateActivities(constraint, dto.activities, options),
            this.validateEquipments(constraint, dto.equipments, options),
            this.validateComponents(constraint, dto.components, options),
        ];

        const errors = results.flatMap(result => result.errors);

        return this.createValidationResult(errors);
    }
}