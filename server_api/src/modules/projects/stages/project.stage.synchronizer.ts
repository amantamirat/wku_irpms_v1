import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IProjectRepository } from "../project.repository";
import { ProjectStatus, PROJECT_TRANSITIONS } from "../project.state-machine";
import { IProjectStageRepository } from "./project.stage.repository";
import { ProjectStageStatus } from "./project.stage.status";

export interface IProjectSynchronizer {
    sync(project: string): Promise<any>;
}

export class ProjectStageSynchronizer implements IProjectSynchronizer {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly projectStageRepo: IProjectStageRepository,
    ) {
    }

    async sync(project: string) {
        const projectDoc = await this.projectRepo.findById(project);
        if (!projectDoc) return;

        const projectDocs = await this.projectStageRepo.find({ project });
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
            const updated = await this.projectRepo.updateStatus(project, newStatus)
            return updated;
        }
    }
}