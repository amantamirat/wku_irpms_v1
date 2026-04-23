import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IThemeRepository, ThemeRepository } from "../../thematics/themes/theme.repository";
import { ConstraintType } from "./constraint.model";
import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";

export class ConstraintValidator {
    constructor(
        private readonly constraintRepo: IConstraintRepository = new ConstraintRepository(),
        private readonly themeRepo: IThemeRepository = new ThemeRepository(),
    ) { }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================

    private async getConstraints(grant: string, types: ConstraintType[]) {
        return await this.constraintRepo.find({
            grant,
            constraints: types
        });
    }

    private validateRange(
        value: number,
        constraint: any,
        label: string,
        options?: { skipMin?: boolean; skipMax?: boolean }
    ) {
        const { skipMin = false, skipMax = false } = options || {};

        if (!skipMin && value < constraint.min) {
            throw new AppError(
                `${label} (${value}) must be at least ${constraint.min}`
            );
        }

        if (!skipMax && value > constraint.max) {
            throw new AppError(
                `${label} (${value}) must be at most ${constraint.max}`
            );
        }
    }

    private validateText(text: string | undefined, constraint: any, label: string) {
        const wordCount = text?.trim() ? text.trim().split(/\s+/).length : 0;
        if (wordCount < constraint.min || wordCount > constraint.max) {
            throw new AppError(
                `${label} word count (${wordCount}) must be between ${constraint.min} and ${constraint.max}`
            );
        }
    }

    private validatePerPhase(phases: any[], field: string, constraint: any, label: string) {
        for (const [i, phase] of (phases ?? []).entries()) {
            const value = phase[field] ?? 0;
            if (value < constraint.min || value > constraint.max) {
                throw new AppError(
                    `${label} in Phase ${i + 1} (${value}) must be between ${constraint.min} and ${constraint.max}`
                );
            }
        }
    }

    // =====================================================
    // GROUPED VALIDATION FUNCTIONS
    // =====================================================

    /**
     * Validates Project Title and Summary word counts.
     * Use in: ProjectService.create, ProjectService.update
     */
    async validateMetadata(grant: string, title: string, summary?: string) {
        const constraints = await this.getConstraints(grant, [
            ConstraintType.PROJECT_TITLE,
            ConstraintType.PROJECT_SUMMARY
        ]);

        for (const c of constraints) {
            if (c.constraint === ConstraintType.PROJECT_TITLE) {
                this.validateText(title, c, "Project title");
            }
            if (c.constraint === ConstraintType.PROJECT_SUMMARY) {
                this.validateText(summary, c, "Project summary");
            }
        }
    }

    /**
     * Validates everything related to phases: Count, Total Budget/Time, and Individual Phase limits.
     * Use in: PhaseService.create, PhaseService.update, PhaseService.delete
     */
    async validatePhases(grant: string, phases: any[]) {
        const constraints = await this.getConstraints(grant, [
            ConstraintType.PHASE_COUNT,
            ConstraintType.BUDGET_TOTAL,
            ConstraintType.TIME_TOTAL,
            ConstraintType.BUDGET_PHASE,
            ConstraintType.TIME_PHASE
        ]);

        const totalBudget = phases.reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = phases.reduce((sum, p) => sum + (p.duration ?? 0), 0);

        for (const c of constraints) {
            switch (c.constraint) {
                case ConstraintType.PHASE_COUNT:
                    this.validateRange(phases.length, c, "Phase count");
                    break;
                case ConstraintType.BUDGET_TOTAL:
                    this.validateRange(totalBudget, c, "Total project budget");
                    break;
                case ConstraintType.TIME_TOTAL:
                    this.validateRange(totalDuration, c, "Total project duration");
                    break;
                case ConstraintType.BUDGET_PHASE:
                    this.validatePerPhase(phases, "budget", c, "Phase budget");
                    break;
                case ConstraintType.TIME_PHASE:
                    this.validatePerPhase(phases, "duration", c, "Phase duration");
                    break;
            }
        }
    }

    /**
     * Validates Participant (Collaborator) counts.
     * Use in: CollaboratorService.create, CollaboratorService.delete
     */
    async validateParticipants(
        grant: string,
        count: number,
        options?: { skipMin?: boolean; skipMax?: boolean }
    ) {
        const constraints = await this.getConstraints(grant, [ConstraintType.PARTICIPANT]);

        for (const c of constraints) {
            this.validateRange(count, c, "Participant count", options);
        }
    }

    /**
     * Validates Themes, Sub-themes, Focus Areas, and Indicators.
     * Use in: ProjectService.updateThemes
     */
    async validateThemes(grant: string, themes: string[]) {
        const constraints = await this.getConstraints(grant, [
            ConstraintType.THEME,
            ConstraintType.SUB_THEME,
            ConstraintType.FOCUS_AREA,
            ConstraintType.INDICATOR
        ]);

        if (!constraints.length || !themes?.length) return;

        const stats = await this.countThemeLevels(themes);

        for (const c of constraints) {
            switch (c.constraint) {
                case ConstraintType.THEME:
                    this.validateRange(stats.themeCount, c, "Theme count");
                    break;
                case ConstraintType.SUB_THEME:
                    this.validateRange(stats.subThemeCount, c, "Sub-theme count");
                    break;
                case ConstraintType.FOCUS_AREA:
                    this.validateRange(stats.focusAreaCount, c, "Focus area count");
                    break;
                case ConstraintType.INDICATOR:
                    this.validateRange(stats.indicatorCount, c, "Indicator count");
                    break;
            }
        }
    }

    /**
     * Runs all validations at once. 
     * Use in: ProjectService.apply (Initial submission)
     */
    async validateAll(grant: string, dto: {
        collaborators: any[],
        phases: any[],
        themes?: string[],
        title: string,
        summary?: string
    }) {
        await Promise.all([
            this.validateMetadata(grant, dto.title, dto.summary),
            this.validatePhases(grant, dto.phases),
            this.validateParticipants(grant, dto.collaborators.length),
            this.validateThemes(grant, dto.themes || [])
        ]);
    }

    // =====================================================
    // THEME RECURSION LOGIC
    // =====================================================
    private async countThemeLevels(themes: string[]) {
        const levelBuckets: Record<number, Set<string>> = { 0: new Set(), 1: new Set(), 2: new Set(), 3: new Set() };

        for (const thm of themes) {
            let current = await this.themeRepo.findById(thm);
            if (!current) throw new AppError(ERROR_CODES.THEME_NOT_FOUND);

            while (current) {
                levelBuckets[current.level].add(current._id.toString());
                if (!current.parent) break;
                current = await this.themeRepo.findById(String(current.parent));
            }
        }

        return {
            themeCount: levelBuckets[0].size,
            subThemeCount: levelBuckets[1].size,
            focusAreaCount: levelBuckets[2].size,
            indicatorCount: levelBuckets[3].size,
        };
    }
}