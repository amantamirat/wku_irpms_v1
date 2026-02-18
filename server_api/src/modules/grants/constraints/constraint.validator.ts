import { ERROR_CODES } from "../../../common/errors/error.codes";
import { ApplicantRepository, IApplicantRepository } from "../../applicants/applicant.repository";
import { CollaboratorRepository, ICollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { IPhaseRepository, PhaseRepository } from "../../projects/phase/phase.repository";
import { IProjectRepository, ProjectRepository } from "../../projects/project.repository";
import { IThemeRepository, ThemeRepository } from "../../thematics/themes/theme.repository";
import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";
import { ProjectConstraintType } from "./project-constraint-type.enum";


export class ConstraintValidator {

    constructor(
        private readonly proRepository: IProjectRepository = new ProjectRepository(),
        private readonly collabRepository: ICollaboratorRepository = new CollaboratorRepository(),
        private readonly phasesRepository: IPhaseRepository = new PhaseRepository(),
        private readonly constraintRepository: IConstraintRepository = new ConstraintRepository(),
        private readonly appRepository: IApplicantRepository = new ApplicantRepository(),
        private readonly themeRepository: IThemeRepository = new ThemeRepository(),
    ) { }


    async validateProjectConstraints(grant: string,
        dto: {
            collaborators: any[],
            phases: any[],
            themes: string[]
        }) {
        const { collaborators, phases, themes } = dto;
        const constraints =
            await this.constraintRepository.find({ //type: ConstraintType.PROJECT,
                 grant: grant });

        if (!constraints || constraints.length === 0) return;

        const numParticipants = collaborators.length;
        const numPhases = phases.length;
        const totalBudget = phases.reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = phases.reduce((sum, p) => sum + (p.duration ?? 0), 0);
        const { themeCount, subThemeCount, focusAreaCount, indicatorCount } = await this.countThemeLevels(themes);

        for (const constraint of constraints) {

            const { min, max } = constraint;

            switch (constraint.constraint) {
                case ProjectConstraintType.PARTICIPANT:
                    if (numParticipants < min || numParticipants > max) {
                        throw new Error(`Participant count (${numParticipants}) must be between ${constraint.min} and ${constraint.max}`);
                    }
                    break;

                case ProjectConstraintType.PHASE_COUNT:
                    if (numPhases < min || numPhases > max) {
                        throw new Error(`Phase count (${numPhases}) must be between ${min} and ${max}`);
                    }
                    break;

                case ProjectConstraintType.BUDGET_TOTAL:
                    if (totalBudget < min || totalBudget > max) {
                        throw new Error(`Total project budget (${totalBudget}) must be between ${min} and ${max}`);
                    }
                    break;

                case ProjectConstraintType.TIME_TOTAL:
                    if (totalDuration < min || totalDuration > max) {
                        throw new Error(`Total project duration (${totalDuration}) must be between ${min} and ${max}`);
                    }
                    break;

                // --- Per-phase constraints ---
                case ProjectConstraintType.BUDGET_PHASE:
                    for (const [i, phase] of (phases ?? []).entries()) {
                        if (phase.budget < min || phase.budget > max) {
                            throw new Error(`Phase ${i + 1} budget (${phase.budget}) must be between ${min} and ${max}`);
                        }
                    }
                    break;

                case ProjectConstraintType.TIME_PHASE:
                    for (const [i, phase] of (phases ?? []).entries()) {
                        if (phase.duration < min || phase.duration > max) {
                            throw new Error(`Phase ${i + 1} duration (${phase.duration}) must be between ${min} and ${max}`);
                        }
                    }
                    break;
                case ProjectConstraintType.THEME:
                    if (themeCount < min || themeCount > max) {
                        throw new Error(`Total project theme (${themeCount}) must be between ${min} and ${max}`);
                    }
                    break;
                case ProjectConstraintType.SUB_THEME:
                    if (subThemeCount < min || subThemeCount > max) {
                        throw new Error(`Total project sub-theme (${subThemeCount}) must be between ${min} and ${max}`);
                    }
                    break;
                case ProjectConstraintType.FOCUS_AREA:
                    if (focusAreaCount < min || focusAreaCount > max) {
                        throw new Error(`Total project focus-area (${focusAreaCount}) must be between ${min} and ${max}`);
                    }
                    break;
                case ProjectConstraintType.INDICATOR:
                    if (indicatorCount < min || indicatorCount > max) {
                        throw new Error(`Total project indicator-theme (${indicatorCount}) must be between ${min} and ${max}`);
                    }
                    break;
                default:
                    // For now, ignore other constraint types
                    break;
            }
        }
    }

    async countThemeLevels(themes: string[]): Promise<{
        themeCount: number;
        subThemeCount: number;
        focusAreaCount: number;
        indicatorCount: number;
    }> {
        const levelBuckets: Record<number, Set<string>> = {
            0: new Set(),
            1: new Set(),
            2: new Set(),
            3: new Set(),
        };
        for (const thm of themes) {
            let current = await this.themeRepository.findById(thm); if (!current) throw new Error(ERROR_CODES.THEME_NOT_FOUND);
            // thmDocs.push(current); 
            while (current) {
                levelBuckets[current.level].add(current._id.toString());
                if (!current.parent) break;
                current = await this.themeRepository.findById(String(current.parent));
                if (!current) break;
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