import { ApplicantRepository } from "../../applicants/applicant.repository";
import { CollaboratorRepository, ICollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { SubmitProjectDTO } from "../../projects/documents/document.dto";
import { PhaseDto } from "../../projects/phase/phase.dto";
import { IPhaseRepository, PhaseRepository } from "../../projects/phase/phase.repository";
import { IProjectRepository, ProjectRepository } from "../../projects/project.repository";
import { ThemeRepository } from "../../thematics/themes/theme.repository";
import { ConstraintType } from "./constraint.model";
import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";
import { ProjectConstraintType } from "./project/project-constraint-type.enum";
import { IProjectConstraint } from "./project/project-constraint.model";


export class ConstraintValidator {

    private proRepository: IProjectRepository;
    private collabRepository: ICollaboratorRepository;
    private phasesRepository: IPhaseRepository;
    private constraintRepository: IConstraintRepository;

    constructor(projectRepository?: IProjectRepository,
        collabRepository?: ICollaboratorRepository,
        phasesRepository?: IPhaseRepository,
        constraintRepository?: IConstraintRepository,
        private readonly appRepository = new ApplicantRepository(),
        private readonly themeRepository = new ThemeRepository(),
    ) {
        this.proRepository = projectRepository || new ProjectRepository();
        this.collabRepository = collabRepository || new CollaboratorRepository();
        this.phasesRepository = phasesRepository || new PhaseRepository();
        this.constraintRepository = constraintRepository || new ConstraintRepository();
    }

    async validateProjectConstraints(grant: string, dto: {
        collaborators: string[],
        phases: PhaseDto[]
    }) {
        const { collaborators, phases } = dto;
        const constraints =
            await this.constraintRepository.find({ type: ConstraintType.PROJECT, grant: grant }) as IProjectConstraint[];

        if (!constraints || constraints.length === 0) return;

        const numParticipants = collaborators.length;
        const numPhases = phases.length;
        const totalBudget = phases.reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = phases.reduce((sum, p) => sum + (p.duration ?? 0), 0);

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
                default:
                    // For now, ignore other constraint types
                    break;
            }
        }

    }
}