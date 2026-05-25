import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { CollaboratorRepository, ICollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { IPhaseRepository, PhaseRepository } from "../../projects/phase/phase.repository";
import { IProject } from "../../projects/project.model";
import { IThemeRepository, ThemeRepository } from "../../thematics/themes/theme.repository";
import { ConstraintType } from "./constraint.model";
import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";

export class ConstraintValidator {
    constructor(
        private readonly constraintRepo: IConstraintRepository = new ConstraintRepository(),
        private readonly themeRepo: IThemeRepository = new ThemeRepository(),
        private readonly phaseRepo: IPhaseRepository = new PhaseRepository(),
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

    async validateProjectTitle(grant: string, title: string) {
        const constraint = await this.constraintRepo.findOne(grant, ConstraintType.PROJECT_TITLE);
        if (!constraint) return
        this.validateText(title, constraint, "Project Title");
    }

    async validateProjectSummary(grant: string, summary?: string) {
        const constraint = await this.constraintRepo.findOne(grant, ConstraintType.PROJECT_SUMMARY);
        if (!constraint) return;
        if (!summary) throw new AppError("Project Summary Required");
        this.validateText(summary, constraint, "Project Summary");
    }
    /**
     * Validates Project Title and Summary word counts.
     * Use in: ProjectService.create, ProjectService.update
     */
    async validateMetadata(grant: string, title: string, summary?: string) {
        await this.validateProjectTitle(grant, title);
        await this.validateProjectSummary(grant, summary);
    }

    // =====================================================
    // THEME VALIDATION AND RECURSION LOGIC
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
    * Validates Participant (Collaborator) counts.
    * Use in: CollaboratorService.create, CollaboratorService.delete
    */
    async validateParticipantCount(grant: string, count: number, options?: { skipMin?: boolean; skipMax?: boolean }) {
        const constraint = await this.constraintRepo.findOne(grant, ConstraintType.PARTICIPANT);
        if (!constraint) return;
        this.validateRange(count, constraint, "Participant count", options);
    }
    /**
       * Validates Totoal Project Budget Limit.
       */
    async validateTotalBudget(grant: string, totalBudget: number, options?: { skipMin?: boolean; skipMax?: boolean }) {
        const constraint = await this.constraintRepo.findOne(grant, ConstraintType.BUDGET_TOTAL);
        if (!constraint) return;
        this.validateRange(totalBudget, constraint, "Total project budget", options);
    }

    /**
       * Validates Totoal Project Duration.
       */
    async validateTotalDuration(grant: string, totalDuration: number, options?: { skipMin?: boolean; skipMax?: boolean }) {
        const constraint = await this.constraintRepo.findOne(grant, ConstraintType.TIME_TOTAL);
        if (!constraint) return;
        this.validateRange(totalDuration, constraint, "Total project duration", options);
    }
    /**
     * Validates the project's cumulative totals and counts.
     */
    async validateProjectTotals(grant: string, totalBudget: number, totalDuration: number, options?: { skipMin?: boolean; skipMax?: boolean }) {
        await this.validateTotalBudget(grant, totalBudget, options);
        await this.validateTotalDuration(grant, totalDuration, options);
    }
    /**
        * Validates Phase count.*/
    async validatePhaseCount(grant: string, phaseCount: number, options?: { skipMin?: boolean; skipMax?: boolean }) {
        const constraint = await this.constraintRepo.findOne(grant, ConstraintType.PHASE_COUNT);
        if (!constraint) return;
        this.validateRange(phaseCount, constraint, "Phase count", options);
    }

    /**
       * Validates Phase Duration.
       */
    async validatePhaseDuration(grant: string, phaseDuration: number, constraint?: any
    ) {
        const c =
            constraint && constraint.constraint === ConstraintType.TIME_PHASE
                ? constraint
                : await this.constraintRepo.findOne(grant, ConstraintType.TIME_PHASE);

        if (!c) return;
        this.validateRange(phaseDuration, c, "Phase duration");
    }

    /**
 * Validates Phase Budget.
 */
    async validatePhaseBudget(
        grant: string,
        phaseBudget: number,
        constraint?: any
    ) {
        const c =
            constraint && constraint.constraint === ConstraintType.BUDGET_PHASE
                ? constraint
                : await this.constraintRepo.findOne(grant, ConstraintType.BUDGET_PHASE);

        if (!c) return;

        this.validateRange(phaseBudget, c, "Phase budget");
    }
    /**
    * Validates Individual Phase Budget and Duration.
    */
    async validateIndividualPhase(
        grant: string,
        phases: any[]
    ) {
        const constraints = await this.getConstraints(grant, [
            ConstraintType.BUDGET_PHASE,
            ConstraintType.TIME_PHASE
        ]);

        const budgetConstraint = constraints.find(
            c => c.constraint === ConstraintType.BUDGET_PHASE
        );

        const durationConstraint = constraints.find(
            c => c.constraint === ConstraintType.TIME_PHASE
        );

        for (const phase of phases) {
            await this.validatePhaseBudget(
                grant,
                phase.budget,
                budgetConstraint,
            );

            await this.validatePhaseDuration(
                grant,
                phase.duration,
                durationConstraint,
            );
        }
    }

    /**
    * Validates everything related to phases: Count, Total Budget/Time, and Individual Phase limits.
    * Use in: PhaseService.create, PhaseService.update, PhaseService.delete
    */
    async validatePhases(grant: string, phases: any[], options?: { skipMin?: boolean; skipMax?: boolean }) {
        await this.validatePhaseCount(grant, phases.length, options);
        await this.validateIndividualPhase(grant, phases);
        const totalBudget = phases.reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = phases.reduce((sum, p) => sum + (p.duration ?? 0), 0);
        await this.validateProjectTotals(grant, totalBudget, totalDuration, options);
    }
    /**
     * Runs all validations at once. 
     * Use in: ProjectService.apply (Initial submission)
     */
    async validateAll(grant: string, dto: {
        participantCount: number,
        phases: any[],
        themes?: string[],
        title: string,
        summary?: string
    }) {
        await Promise.all([
            this.validateMetadata(grant, dto.title, dto.summary),
            this.validatePhases(grant, dto.phases),
            this.validateParticipantCount(grant, dto.participantCount),
            this.validateThemes(grant, dto.themes || [])
        ]);
    }


    async validateProject(grant: string, projectDoc: IProject) {
        const participantCount = projectDoc.totalCollabs ?? 0;
        const phases = await this.phaseRepo.find({ project: String(projectDoc._id) });
        const themes = projectDoc.themes.map(thm => thm.toString());
        const title = projectDoc.title;
        const summary = projectDoc.summary;
        await this.validateAll(grant, { participantCount, phases, themes, title, summary });
    }

}