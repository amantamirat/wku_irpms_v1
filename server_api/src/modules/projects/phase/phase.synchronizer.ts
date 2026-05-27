import { ClientSession } from "mongoose";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { PROJECT_TRANSITIONS } from "../project.state-machine";
import { PhaseStatus } from "./phase.model";
import { IPhaseRepository } from "./phase.repository";


export interface IPhaseSynchronizer {
    sync(
        project: string,
        session?: ClientSession
    ): Promise<any>;
}

export class PhaseSynchronizer
    implements IPhaseSynchronizer {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly phaseRepo: IPhaseRepository
    ) { }

    async sync(
        project: string,
        session?: ClientSession
    ) {
        const projectDoc = await this.projectRepo
            .findById(project, undefined, session);

        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        /**
        * compute & synchronize project status
       */
        const currentStatus = projectDoc.status;

        let newStatus = currentStatus;

        const phases = await this.phaseRepo.find({ project: project });


        if (phases.some(p => (p.status === PhaseStatus.active))) {
            newStatus = ProjectStatus.active
        }
        
        else if (phases.every(p => p.status === PhaseStatus.completed)) {
            newStatus = ProjectStatus.completed
        }

        if (newStatus !== currentStatus) {

            TransitionHelper.validateTransition(
                currentStatus,
                newStatus,
                PROJECT_TRANSITIONS
            );

            return await this.projectRepo
                .updateStatus(
                    project,
                    newStatus,
                    session
                );
        }

        return projectDoc;
    }
}