import { Call } from "../../calls/call.model";
import { ICollaboratorRepository, CollaboratorRepository } from "../../projects/collaborators/collaborator.repository";
import { PhaseDto } from "../../projects/phase/phase.dto";
import { IPhaseRepository, PhaseRepository } from "../../projects/phase/phase.repository";
import { SubmitProjectDTO } from "../../projects/project.dto";
import { IProject } from "../../projects/project.model";
import { IProjectRepository, ProjectRepository } from "../../projects/project.repository";
import { ConstraintType } from "./constraint-type.enum";
import { IConstraintRepository, ConstraintRepository } from "./constraint.repository";
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
        constraintRepository?: IConstraintRepository
    ) {
        this.proRepository = projectRepository || new ProjectRepository();
        this.collabRepository = collabRepository || new CollaboratorRepository();
        this.phasesRepository = phasesRepository || new PhaseRepository();
        this.constraintRepository = constraintRepository || new ConstraintRepository();
    }

    async validateProject(projectId?: string, project?: Partial<IProject>, projectDto?: SubmitProjectDTO) {
        if (!projectId && !projectDto) {
            throw new Error("Project Not Found!");
        }
        let collaborators, phases, cycleId;
        if (projectId) {
            const projectDoc = project ?? await this.proRepository.findById(projectId);
            if (!projectDoc) {
                throw new Error("Project Not Found!");
            }
            cycleId = String(projectDoc.cycle);
            const collabs = await this.collabRepository.find({ project: projectId });
            collaborators = collabs.map(c => String(c.applicant));
            phases = await this.phasesRepository.find({ project: projectId });
        }
        else if (projectDto) {
            collaborators = projectDto.collaborators;
            phases = projectDto.phases;
            cycleId = projectDto.cycle;
        }

        const cycleDoc = await Call.findById(cycleId);
        if (!cycleDoc) {
            throw new Error("Cycle Not Found!");
        }
       await this.validateProjectConstraints(String(cycleDoc.grant), collaborators, phases);
    }


    async validateProjectConstraints(grantId: string, collaborators?: string[], phases?: PhaseDto[]) {
        const constraints =
            await this.constraintRepository.find({ type: ConstraintType.PROJECT, grantId: grantId }) as IProjectConstraint[];

        if (!constraints || constraints.length === 0) return;

        const numParticipants = collaborators?.length ?? 0;
        const numPhases = phases?.length ?? 0;
        const totalBudget = (phases ?? []).reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = (phases ?? []).reduce((sum, p) => sum + (p.duration ?? 0), 0);

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