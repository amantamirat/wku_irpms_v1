import fs from "fs";
import path from "path";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";

import { IGrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { IProjectRepository } from "../project.repository";
import { IProjectStageRepository } from "./project.stage.repository";

import { ClientSession } from "mongoose";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { CallStageStatus } from "../../calls/stages/call.stage.model";
import { ICallStageRepository } from "../../calls/stages/call.stage.repository";
import { IGrantAllocation } from "../../grants/allocations/grant.allocation.model";
import { IGrantStage } from "../../grants/stages/grant.stage.model";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import {
    CreateProjectStageDTO,
    GetProjectStageDTO,
    UpdateStageDTO
} from "./project.stage.dto";
import { ProjectStageStatus } from "./project.stage.model";
import { IProjectSynchronizer } from "./project.stage.synchronizer";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { CompositionValidator } from "../../grants/compositions/composition.validator";
import { string } from "joi";

export class ProjectStageService {

    constructor(
        private readonly repository: IProjectStageRepository,
        private readonly projAuth: ProjectAuth,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly callStageRepo: ICallStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly synchronizer: IProjectSynchronizer,
        private readonly notificationService: NotificationService,
        //private readonly constraintValidator: ConstraintValidator = new ConstraintValidator(),
        //private readonly compositionValidator: CompositionValidator = new CompositionValidator(),

    ) {
    }

    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant, session);
        if (
            projectDoc.status !== ProjectStatus.draft
            && projectDoc.status !== ProjectStatus.submitted
            // && projectDoc.status !== ProjectStatus.completed
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }
    /**
     * Create project stage (submission)
     */
    async create(dto: CreateProjectStageDTO, options?: { skipValidation?: boolean }, session?: ClientSession) {
        const { project, projectTitle, stageName, applicantId } = dto;
        if (!options?.skipValidation) {
            const projectDoc = await this.validateProject(project, applicantId, session);
            const grantAllocDoc = projectDoc.grantAllocation as unknown as IGrantAllocation;
            const grantId = String(grantAllocDoc.grant);
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
                    if (currentStageDoc.status !== ProjectStageStatus.accepted) {
                        throw new AppError(ERROR_CODES.CURRENT_STAGE_NOT_ACCEPTED);
                    }
                    nextOrder = (currentStageDoc.grantStage as unknown as IGrantStage).order + 1;
                }
            }


            const nextGrantStageDoc = await this.grantStageRepo.findOne(grantId, nextOrder, session);
            if (!nextGrantStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            const nextGrantStageId = String(nextGrantStageDoc._id);
            dto.grantStage = nextGrantStageId;
            
            if (projectDoc.call) {
                const nextCallStageDoc = await this.callStageRepo.findOne(
                    { callId: String(projectDoc.call), grantStageId: nextGrantStageId },
                    session
                );
                if (!nextCallStageDoc) {
                    throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
                }
                if (nextCallStageDoc.status !== CallStageStatus.active) {
                    throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
                }
                if (nextCallStageDoc.deadline < new Date()) {
                    throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);
                }
                dto.callStage = String(nextCallStageDoc._id)
            }

            //validateall
        }


        try {
            const created = await this.repository.create(dto, session);
            await this.synchronizer.sync(project, session);
            await this.notificationService.notifyStatusChange(
                applicantId,
                projectTitle ?? "Project",
                stageName || "Stage",
                ProjectStageStatus.submitted,
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
    async get(dto: GetProjectStageDTO) {
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
    async update(dto: UpdateStageDTO) {
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
            projectStage: id,
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

        const from = projStageDoc.status as ProjectStageStatus;
        const to = next as ProjectStageStatus;

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
            to === ProjectStageStatus.accepted ||
            to === ProjectStageStatus.rejected
        ) {
            const totalScore = projStageDoc.totalScore;

            if (totalScore === undefined || totalScore === null) {
                throw new AppError(
                    ERROR_CODES.SCORE_NOT_COMPUTED,
                    "Total score not computed. Please calculate score first."
                );
            }

            const grantStageDoc = projStageDoc.grantStage as unknown as IGrantStage;

            const countApproved = await this.reviewerRepo.countByProjectStage(id, ReviewerStatus.approved);

            if (countApproved < grantStageDoc.minReviewers) {
                throw new AppError(
                    ERROR_CODES.INSUFFICIENT_REVIEWS,
                    `At least ${grantStageDoc.minReviewers} completed reviews are required before computing score.`
                );
            }

            if (to === ProjectStageStatus.accepted) {
                const minAcceptanceScore = grantStageDoc.minAcceptanceScore ?? 0;

                if (totalScore < minAcceptanceScore) {
                    throw new AppError(
                        ERROR_CODES.SCORE_BELOW_THRESHOLD,
                        `Cannot accept. Minimum required score is ${minAcceptanceScore}, but got ${totalScore}.`
                    );
                }
            }
        }

        if (to === ProjectStageStatus.submitted) {
            /*
            if (await this.reviewerRepo.exist({ projectStage: id })) {
                throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
            }
            */
        }

        const updated = await this.repository.updateStatus(id, to);
        // Trigger Notification using the populated data
        await this.synchronizer.sync(projectData._id);

        if (projectData?.applicant) {
            let nextStageInfo = undefined;
            // Discover next stage only if current stage was accepted
            if (to === ProjectStageStatus.accepted) {
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
                projectData,
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
        if (projectStageDoc.status !== ProjectStageStatus.submitted) throw new AppError(ERROR_CODES.DOC_NOT_SUBMITTED);

        const project = String(projectStageDoc.project);
        await this.validateProject(project, applicantId ?? "");

        if (await this.reviewerRepo.exist({ projectStage: id })) {
            throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
        }

        // ✅ DELETE FILE FIRST
        if (projectStageDoc.documentPath) {
            const filePath = path.resolve(projectStageDoc.documentPath);

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("File deletion failed:", err.message);
                    // optional: don't throw, just log (avoid breaking delete flow)
                }
            });
        }

        // ✅ DELETE DB RECORD
        const deleted = await this.repository.delete(id);
        await this.synchronizer.sync(project);
        return deleted;
    }
}

export const PROJECT_STAGE_TRANSITIONS: Record<ProjectStageStatus, ProjectStageStatus[]> = {
    [ProjectStageStatus.submitted]: [ProjectStageStatus.accepted, ProjectStageStatus.rejected],
    [ProjectStageStatus.accepted]: [ProjectStageStatus.submitted],
    [ProjectStageStatus.rejected]: [ProjectStageStatus.submitted]
};
