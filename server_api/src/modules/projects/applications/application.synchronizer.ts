import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { PROJECT_TRANSITIONS } from "../project.state-machine";
import { ApplicationStatus } from "./application.model";
import { IApplicationRepository } from "./application.repository";

export class ApplicationSynchronizer {
    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly applicationRepo: IApplicationRepository,
        private readonly stageRepo: IStageRepository
    ) { }

    async sync(project: string) {
        const projectDoc = await this.projectRepo.findById(project);
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const latestApplication = await this.applicationRepo.findLatestByProject(project);

        /**
         * Synchronize currentApplication
         */
        const currentId = projectDoc.currentApplication
            ? String(projectDoc.currentApplication)
            : undefined;

        if (!latestApplication) {
            if (currentId) {
                await this.projectRepo.clearCurrentApplication(project);
            }
        } else {
            const latestId = String(latestApplication._id);

            if (currentId !== latestId) {
                await this.projectRepo.updateCurrentApplication(
                    project,
                    latestId
                );
            }
        }

        /**
         * Compute project status
         */
        const currentStatus = projectDoc.status;
        let newStatus = ProjectStatus.draft;

        if (latestApplication) {
            newStatus = ProjectStatus.submitted;

            switch (latestApplication.status) {
                case ApplicationStatus.rejected:
                    newStatus = ProjectStatus.rejected;
                    break;

                case ApplicationStatus.accepted: {
                    const stage = await this.stageRepo.findById(
                        String(latestApplication.stage)
                    );

                    if (!stage) {
                        throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
                    }

                    const totalStages = await this.stageRepo.countStages(
                        String(stage.call)
                    );

                    if (stage.order >= totalStages) {
                        newStatus = ProjectStatus.accepted;
                    }

                    break;
                }
            }
        }
        /**
         * Synchronize project status
         */
        if (newStatus !== currentStatus) {
            TransitionHelper.validateTransition(
                currentStatus,
                newStatus,
                PROJECT_TRANSITIONS
            );

            return await this.projectRepo.updateStatus(
                project,
                newStatus
            );
        }

        return projectDoc;
    }
}