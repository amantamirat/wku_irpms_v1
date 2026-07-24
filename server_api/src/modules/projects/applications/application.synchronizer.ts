import { ClientSession } from "mongoose";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IGrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { PROJECT_TRANSITIONS } from "../project.state-machine";
import {
    IApplication,
    ApplicationStatus
} from "./application.model";
import { IApplicationRepository } from "./application.repository";
import { StageCategory } from "../../grants/stages/grant.stage.model";

export interface IProjectSynchronizer {
    sync(
        project: string,
        session?: ClientSession
    ): Promise<any>;
}

export class ProjectStageSynchronizer
    implements IProjectSynchronizer {

    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly projectStageRepo: IApplicationRepository,
        private readonly grantStageRepo: IGrantStageRepository
    ) { }

    async sync(
        project: string,
        session?: ClientSession
    ) {
        const projectDoc = await this.projectRepo
            .findById(project, { populate: { currentStage: true } }, session);

        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        /**
         * discover latest project stage
         */
        const latestStageDoc = await this.projectStageRepo
            .findLatestByProject(project, session);
        /**
         * synchronize currentStage
         */
        if (!latestStageDoc) {
            await this.projectRepo.clearCurrentStage(project, session);
            projectDoc.currentStage = undefined as any;
        }
        else {
            const currentStageId = projectDoc.currentStage ? String(projectDoc.currentStage._id) : undefined;
            const latestStageId = String(latestStageDoc._id);

            if (currentStageId !== latestStageId) {
                await this.projectRepo.updateCurrentStage(
                    project,
                    latestStageId,
                    session
                );
                projectDoc.currentStage = latestStageDoc as any;
            }
        }

        /**
         * compute project status
        */
        const currentStatus = projectDoc.status;

        let newStatus = ProjectStatus.draft;

        if (projectDoc.currentStage) {

            newStatus = ProjectStatus.submitted;

            const currentStageDoc = projectDoc.currentStage as unknown as IApplication;

            if (currentStageDoc.status === ApplicationStatus.rejected) {
                newStatus = ProjectStatus.rejected;
            }
            else if (currentStageDoc.status === ApplicationStatus.accepted) {

                const grantStageDoc = await this.grantStageRepo.findById(String(currentStageDoc.stage), session);
                if (!grantStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

                const totalStages = await this.grantStageRepo.
                    countStages(String(grantStageDoc.grant), StageCategory.selection, session);

                if (grantStageDoc.order >= totalStages) {
                    newStatus = ProjectStatus.accepted; // last stage accepted
                }
            }
        }

        /**
         * synchronize project status
         */
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