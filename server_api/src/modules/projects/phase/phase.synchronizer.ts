import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { PROJECT_TRANSITIONS } from "../project.state-machine";
import { PhaseStatus } from "./phase.model";
import { IPhaseRepository } from "./phase.repository";


export class PhaseSynchronizer {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly phaseRepo: IPhaseRepository
    ) { }

    async sync(projectId: string) {
        const projectDoc = await this.projectRepo.findById(projectId);

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }

        const phases = await this.phaseRepo.find({
            project: projectId
        });

        if (!phases.length) {
            return projectDoc;
        }

        const currentStatus = projectDoc.status;
        let newStatus = currentStatus;

        const hasTerminated = phases.some(
            phase => phase.status === PhaseStatus.terminated
        );

        const hasActive = phases.some(
            phase => phase.status === PhaseStatus.active
        );

        const allCompleted = phases.every(
            phase => phase.status === PhaseStatus.completed
        );

        const allApproved = phases.every(
            phase => phase.status === PhaseStatus.approved
        );

        if (hasTerminated) {
            newStatus = ProjectStatus.terminated;
        }
        else if (allCompleted) {
            newStatus = ProjectStatus.completed;
        }
        else if (hasActive) {
            newStatus = ProjectStatus.active;
        }
        else if (
            allApproved &&
            currentStatus === ProjectStatus.active
        ) {
            newStatus = ProjectStatus.granted;
        }

        if (newStatus === currentStatus) {
            return projectDoc;
        }

        TransitionHelper.validateTransition(
            currentStatus,
            newStatus,
            PROJECT_TRANSITIONS
        );

        return this.projectRepo.updateStatus(
            projectId,
            newStatus
        );
    }
}