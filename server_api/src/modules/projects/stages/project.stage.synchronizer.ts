import { ClientSession } from "mongoose";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IProjectRepository } from "../project.repository";
import { PROJECT_TRANSITIONS } from "../project.state-machine";
import { ProjectStatus } from "../project.model";
import { IProjectStageRepository } from "./project.stage.repository";
import { ProjectStageStatus } from "./project.stage.model";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";

export interface IProjectSynchronizer {
    sync(project: string, session?: ClientSession): Promise<any>;
}

export class ProjectStageSynchronizer implements IProjectSynchronizer {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly projectStageRepo: IProjectStageRepository,
    ) {
    }

    async sync(project: string, session?: ClientSession) {
        const projectDoc = await this.projectRepo.findById(project, undefined, session);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        const projectDocs = await this.projectStageRepo.find({ project }, session);
        const currentStatus = projectDoc.status;

        let newStatus = ProjectStatus.submitted;
        if (projectDocs.length === 0) {
            newStatus = ProjectStatus.draft;
        }
        else if (projectDocs.some(d => d.status === ProjectStageStatus.rejected)) {
            newStatus = ProjectStatus.rejected;
        }
        else if (projectDocs.every(d => d.status === ProjectStageStatus.accepted)) {
            newStatus = ProjectStatus.accepted;
        }
        if (newStatus !== currentStatus) {
            TransitionHelper.validateTransition(
                projectDoc.status,
                newStatus,
                PROJECT_TRANSITIONS
            );
            const updated = await this.projectRepo.updateStatus(project, newStatus, session)
            return updated;
        }
    }
}