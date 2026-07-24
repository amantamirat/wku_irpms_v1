import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { IApplicationRepository } from "./application.repository";
import { ClientSession } from "mongoose";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { IGrantStage } from "../../grants/stages/grant.stage.model";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import {
    CreateApplicationDTO,
    GetApplicationDTO,
    UpdateApplicationDTO
} from "./application.dto";
import { ApplicationStatus } from "./application.model";
import { IProjectSynchronizer } from "./application.synchronizer";

export class ApplicationService {

    constructor(
        private readonly repository: IApplicationRepository,
        private readonly projRepo: IProjectRepository,
        private readonly stageRepo: IStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly synchronizer?: IProjectSynchronizer,
        private readonly notificationService?: NotificationService,
        private readonly projAuth: ProjectAuth = new ProjectAuth(projRepo),

    ) {
    }

    async validateProject(project: string, applicant: string) {
        const projectDoc = await this.projAuth.authProject(project, applicant);
        if (
            projectDoc.status !== ProjectStatus.draft
            && projectDoc.status !== ProjectStatus.submitted
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }
    /**
     * Create project stage (submission)
     */
    async create(dto: CreateApplicationDTO, options?: { skipValidation?: boolean }) {
        const { project, userId } = dto;
        if (!options?.skipValidation) {
            const projectDoc = await this.validateProject(project, userId);
            const callId = String(projectDoc.call);
            const count = await this.repository.countByProject(project);
            let nextOrder = count + 1;
            const nextStageDoc = await this.stageRepo.findOne(callId, nextOrder);
            if (!nextStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            const deadline = nextStageDoc.deadline;
            if (deadline < new Date()) {
                throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);
            }
        }
        try {
            const created = await this.repository.create(dto);

            if (this.synchronizer && this.notificationService) {
                await this.synchronizer.sync(project);
                await this.notificationService.notifyStatusChange(
                    userId,
                    "Project",
                    "Stage",
                    ApplicationStatus.submitted,
                    undefined
                ).catch(err => console.error("Notification failed", err));
            }

            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    /**
     * Get project stages
     */
    async get(dto: GetApplicationDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Get by ID
     */
    async getById(id: string) {
        const appDoc = await this.repository.findById(id);
        if (!appDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
        return appDoc;
    }

    /**
     * Update stage 
     */
    async update(dto: UpdateApplicationDTO) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
    }

    async calculateTotalScore(id: string) {
        const projStageDoc = await this.repository.findById(id, {
            populate: {
                grantStage: true
            }
        });
        if (!projStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const grantStageDoc = projStageDoc.stage as unknown as IGrantStage;

        const approvedReviews = await this.reviewerRepo.find({
            projectApplication: id,
            status: ReviewerStatus.approved
        });

        if (approvedReviews.length < grantStageDoc.minReviewers) {
            throw new AppError(
                ERROR_CODES.INSUFFICIENT_REVIEWS,
                `At least ${grantStageDoc.minReviewers} completed reviews are required before computing score.`
            );
        }

        const totalWeight = approvedReviews.reduce(
            (sum, r) => sum + (r.weight ?? 1),
            0
        );

        if (totalWeight === 0) return 0;

        const score =
            approvedReviews.reduce(
                (sum, r) => sum + (r.score ?? 0) * (r.weight ?? 1),
                0
            ) / totalWeight;

        // persist if changed (with float-safe comparison)
        if (Math.abs((projStageDoc.totalScore ?? 0) - score) > 0.0001) {
            await this.repository.update(id, { totalScore: score });
        }

        return score;
    }

    /**
     * Transition stage status (state machine)
     */
    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const projStageDoc = await this.repository.findById(id, {
            populate: {
                grantStage: true,
                project: true
            }
        });
        if (!projStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const projectData = projStageDoc.project as any;
        const projStatus = projectData.status;

        if (projStatus !== ProjectStatus.draft && projStatus !== ProjectStatus.submitted
            && projStatus !== ProjectStatus.rejected && projStatus !== ProjectStatus.accepted
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        const from = projStageDoc.status as ApplicationStatus;
        const to = next as ApplicationStatus;

        // Prevent race condition
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        // Validate state transition
        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_STAGE_TRANSITIONS
        );
        if (
            to === ApplicationStatus.accepted ||
            to === ApplicationStatus.rejected
        ) {
            const totalScore = projStageDoc.totalScore;

            const grantStageDoc = projStageDoc.stage as unknown as IGrantStage;

            if ((totalScore === undefined || totalScore === null) && grantStageDoc.minReviewers > 0) {
                throw new AppError(
                    ERROR_CODES.SCORE_NOT_COMPUTED,
                    "Total score not computed. Please calculate score first."
                );
            }

            const countApproved = await this.reviewerRepo.countByProjectStage(id, ReviewerStatus.approved);

            if (countApproved < grantStageDoc.minReviewers) {
                throw new AppError(
                    ERROR_CODES.INSUFFICIENT_REVIEWS,
                    `At least ${grantStageDoc.minReviewers} completed reviews are required before computing score.`
                );
            }

            if (to === ApplicationStatus.accepted) {
                const minAcceptanceScore = grantStageDoc.minAcceptanceScore ?? 0;

                if ((totalScore ?? 0) < minAcceptanceScore) {
                    throw new AppError(
                        ERROR_CODES.SCORE_BELOW_THRESHOLD,
                        `Cannot accept. Minimum required score is ${minAcceptanceScore}, but got ${totalScore}.`
                    );
                }
            }
        }

        if (to === ApplicationStatus.submitted) {
            /*
            if (await this.reviewerRepo.exist({ projectStage: id })) {
                throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
            }
            */
        }

        const updated = await this.repository.updateStatus(id, to);
        /**
         * const syncedProjectDoc = await this.synchronizer.sync(projectData._id);

        if (syncedProjectDoc.status === ProjectStatus.accepted) {
            await this.notificationService.notifyProjectFinalization(
                String(syncedProjectDoc.applicant),
                syncedProjectDoc,
                undefined // senderId if available
            )
        } else if (syncedProjectDoc.status === ProjectStatus.submitted ||
            syncedProjectDoc.status === ProjectStatus.rejected
        ) {
            let nextStageInfo = undefined;
            // Discover next stage only if current stage was accepted
            if (to === ApplicationStatus.accepted) {
                const grantStageDoc = projStageDoc.stage as unknown as IGrantStage;
                const nextOrder = grantStageDoc.order + 1
                const grantId = grantStageDoc.grant;

                const nextGrantStage = await this.grantStageRepo.findOne(String(grantId), nextOrder);

                if (nextGrantStage) {
                    const nextCallStage = projectData.call
                        ? await this.stageRepo.findOne(String(projectData.call), nextOrder)
                        : null;

                    nextStageInfo = {
                        name: nextGrantStage.name,
                        deadline: //nextCallStage?.status === CallStageStatus.active ?
                            new Date()//nextCallStage?.deadline //: undefined
                    };
                }
            }
            const stageData = projStageDoc.stage as any;

            await this.notificationService.notifyStatusChange(
                String(projectData.applicant),
                projectData.title,
                stageData?.name || "Stage",
                to,
                nextStageInfo
            ).catch(err => console.error("Notification failed", err));
        }
         * 
         */
        // Trigger Notification using the populated data

        return updated;
    }

    /**
     * Delete 
     */
    async delete(dto: DeleteDto) {
        const { id, userId: applicantId } = dto;

        const projectStageDoc = await this.repository.findById(id);
        if (!projectStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        if (projectStageDoc.status !== ApplicationStatus.submitted) throw new AppError(ERROR_CODES.DOC_NOT_SUBMITTED);

        const project = String(projectStageDoc.project);
        await this.validateProject(project, applicantId ?? "");

        if (await this.reviewerRepo.exist({ projectApplication: id })) {
            throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
        }
        const deleted = await this.repository.delete(id);
        // await this.synchronizer.sync(project);
        return deleted;
    }
}

export const PROJECT_STAGE_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.submitted]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.submitted],
    [ApplicationStatus.rejected]: [ApplicationStatus.submitted]
};
