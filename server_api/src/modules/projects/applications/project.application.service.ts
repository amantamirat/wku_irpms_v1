import fs from "fs";
import path from "path";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";

import { IGrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { IProjectApplicationRepository } from "./project.application.repository";

import { ClientSession } from "mongoose";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { CallStageStatus } from "../../calls/stages/call.stage.model";
import { ICallStageRepository } from "../../calls/stages/call.stage.repository";
import { IGrantAllocation } from "../../grants/allocations/grant.allocation.model";
import { CompositionValidator } from "../../grants/compositions/composition.validator";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { IGrantStage } from "../../grants/stages/grant.stage.model";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import {
    CreateProjectApplicationDTO,
    GetProjectApplicationDTO,
    UpdateApplicationDTO
} from "./project.application.dto";
import { ApplicationStatus } from "./project.application.model";
import { IProjectSynchronizer } from "./project.application.synchronizer";
import { CallRepository, ICallRepository } from "../../calls/call.repository";

export class ProjectApplicationService {

    constructor(
        private readonly repository: IProjectApplicationRepository,
        private readonly projAuth: ProjectAuth,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly callStageRepo: ICallStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly synchronizer: IProjectSynchronizer,
        private readonly notificationService: NotificationService,
        private readonly constValidator: ConstraintValidator = new ConstraintValidator(),
        private readonly compValidator: CompositionValidator = new CompositionValidator(),
        private readonly callRepo: ICallRepository = new CallRepository(),

    ) {
    }

    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant, session);
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
    async create(dto: CreateProjectApplicationDTO, options?: { skipValidation?: boolean }, session?: ClientSession) {
        const { project, applicantId } = dto;
        if (!options?.skipValidation) {
            const projectDoc = await this.validateProject(project, applicantId, session);
            dto.projectTitle = projectDoc.title;
            const grantId = String(projectDoc.grant);
            let nextOrder = 1;
            if (projectDoc.currentStage) {
                if (projectDoc.status === ProjectStatus.completed) {
                    nextOrder = 0;//verification
                }
                else {
                    const currentStageDoc = await this.repository
                        .findById(String(projectDoc.currentStage), {
                            populate: {
                                grantStage: true
                            }
                        }, session);
                    if (!currentStageDoc) {
                        throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
                    }
                    if (currentStageDoc.status !== ApplicationStatus.accepted) {
                        throw new AppError(ERROR_CODES.CURRENT_STAGE_NOT_ACCEPTED);
                    }
                    nextOrder = (currentStageDoc.grantStage as unknown as IGrantStage).order + 1;
                }
            }


            const nextGrantStageDoc = await this.grantStageRepo.findOne(grantId, nextOrder, session);
            if (!nextGrantStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            const nextGrantStageId = String(nextGrantStageDoc._id);
            dto.grantStage = nextGrantStageId;
            dto.stageName = nextGrantStageDoc.name;
            if (projectDoc.call) {
                const callDoc = await this.callRepo.findById(String(projectDoc.call));
                const deadline = callDoc?.deadlines?.[nextOrder - 1]?.submission;
                if (!deadline) {
                    throw new AppError(ERROR_CODES.DEADLINE_NOT_FOUND);
                }
                if (deadline < new Date()) {
                    throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);
                }
            }
            if (nextOrder === 1) {
                await this.constValidator.validateProject(grantId, projectDoc);
                await this.compValidator.validateProjectAggregate(grantId, project);
            }
        }

        try {
            const created = await this.repository.create(dto, session);
            await this.synchronizer.sync(project, session);
            await this.notificationService.notifyStatusChange(
                applicantId,
                dto.projectTitle ?? "Project",
                dto.stageName ?? "Stage",
                ApplicationStatus.submitted,
                undefined,
                session
            ).catch(err => console.error("Notification failed", err));
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
    async get(dto: GetProjectApplicationDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Get by ID
     */
    async getById(id: string) {
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        return stage;
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

        const grantStageDoc = projStageDoc.grantStage as unknown as IGrantStage;

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

            const grantStageDoc = projStageDoc.grantStage as unknown as IGrantStage;

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
        // Trigger Notification using the populated data
        const syncedProjectDoc = await this.synchronizer.sync(projectData._id);

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
                const grantStageDoc = projStageDoc.grantStage as unknown as IGrantStage;
                const nextOrder = grantStageDoc.order + 1
                const grantId = grantStageDoc.grant;

                const nextGrantStage = await this.grantStageRepo.findOne(String(grantId), nextOrder);

                if (nextGrantStage) {
                    const nextCallStage = projectData.call
                        ? await this.callStageRepo.findOne({ callId: String(projectData.call), order: nextOrder })
                        : null;

                    nextStageInfo = {
                        name: nextGrantStage.name,
                        deadline: //nextCallStage?.status === CallStageStatus.active ?
                            nextCallStage?.deadline //: undefined
                    };
                }
            }
            const stageData = projStageDoc.grantStage as any;

            await this.notificationService.notifyStatusChange(
                String(projectData.applicant),
                projectData.title,
                stageData?.name || "Stage",
                to,
                nextStageInfo
            ).catch(err => console.error("Notification failed", err));


        }
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
        await this.synchronizer.sync(project);
        return deleted;
    }
}

export const PROJECT_STAGE_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.submitted]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.submitted],
    [ApplicationStatus.rejected]: [ApplicationStatus.submitted]
};
