import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { CallStatus } from "../../calls/call.model";
import { ICallRepository } from "../../calls/call.repository";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { TemplateValidationService } from "../../templates/services/template-validation.service";
import { ProjectStatus } from "../project.model";
import { ProjectService } from "../project.service";
import {
    ApplyProjectDTO,
    CreateApplicationDTO,
    GetApplicationDTO,
    UpdateApplicationDTO
} from "./application.dto";
import { ApplicationStatus } from "./application.model";
import { IApplicationRepository } from "./application.repository";
import { ApplicationSynchronizer } from "./application.synchronizer";

export class ApplicationService {

    constructor(
        private readonly repository: IApplicationRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly projectService: ProjectService,
        private readonly constraintValidator: ConstraintValidationService,
        private readonly templateValidator: TemplateValidationService,
        private readonly synchronizer: ApplicationSynchronizer,
        private readonly notificationService?: NotificationService,
    ) {
    }

    /**
     * Create project application
     */
    async create(
        dto: CreateApplicationDTO, options?: { skipValidation?: boolean }
    ) {
        const { project, stage, documentPath } = dto;

        const projectDoc = await this.projectService.getById(project);

        if (!projectDoc.call)
            throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

        const callId = String(projectDoc.call);

        const stageDoc = await this.stageRepo.findById(stage);

        if (!stageDoc)
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const currentAppId = String(projectDoc.currentApplication);

        if (currentAppId) {
            const currentApp = await this.repository.findById(currentAppId);

            if (!currentApp) {
                throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
            }

            if (currentApp.status !== ApplicationStatus.accepted) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_NOT_ACCEPTED,
                    "The current application must be accepted before proceeding."
                );
            }

            const currentAppStageDoc = await this.stageRepo.findById(String(currentApp.stage));
            if (!currentAppStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

            const expectedNextStage = await this.stageRepo.getNextStage(callId, currentAppStageDoc.order);
            if (
                !expectedNextStage ||
                String(expectedNextStage._id) !== String(stage)
            ) {
                throw new AppError(
                    ERROR_CODES.INVALID_STAGE,
                    "The provided stage is not the valid next stage for this project"
                );
            }
        } else {
            const firstStage = await this.stageRepo.getFirstStage(callId);
            if (!firstStage)
                throw new AppError(ERROR_CODES.FIRST_STAGE_NOT_FOUND);

            if (String(firstStage._id) !== stage) {
                throw new AppError(
                    ERROR_CODES.INVALID_STAGE,
                    "First application must be submitted for Stage 1"
                );
            }
        }

        if (!options?.skipValidation) {
            // Deadline
            if (
                stageDoc.deadline &&
                new Date(stageDoc.deadline) < new Date()
            ) {
                throw new AppError(
                    ERROR_CODES.STAGE_DEADLINE_PASSED
                );
            }
            // Template
            if (stageDoc.template) {
                const result =
                    await this.templateValidator.validate(
                        String(stageDoc.template),
                        documentPath
                    );

                if (!result.valid) {
                    throw new AppError(
                        ERROR_CODES.INVALID_DOCUMENT,
                        "Document validation failed",
                        400,
                        result
                    );
                }
            }
        }

        try {
            const created = await this.repository.create(dto);

            await this.synchronizer.sync(project);

            if (this.notificationService) {
                await this.notificationService.notifyApplicationSubmitted(
                    String(projectDoc.leadPI),
                    projectDoc.title,
                    stageDoc.name
                );
            }
            return created;

        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(
                    ERROR_CODES.STAGE_ALREADY_EXISTS
                );
            }
            throw err;
        }
    }

    async apply(dto: ApplyProjectDTO) {
        const { call, title, summary, leadPI, collaborators, phases, themes, userId, docPath } = dto;
        const lead = collaborators.find(c => c.isLeadPI);
        if (!lead) throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        if (lead.member !== userId) throw new AppError(ERROR_CODES.UNAUTHORIZED);

        const callDoc = await this.callRepo.findById(call);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

        const deadline = callDoc.deadline;
        if (!deadline) throw new AppError(ERROR_CODES.CALL_DEADLINE_NOT_SET);
        if (deadline < new Date()) throw new AppError(ERROR_CODES.CALL_DEADLINE_PASSED);

        const firstStage = await this.stageRepo.getFirstStage(call);
        if (!firstStage)
            throw new AppError(ERROR_CODES.FIRST_STAGE_NOT_FOUND);

        if (callDoc.constraint) {
            const constraintId = String(callDoc.constraint);
            const result = await this.constraintValidator.validateProject(constraintId, dto);
            if (!result.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_CONSTRAINT,
                    "Constraint validation failed",
                    400,
                    result
                );
            }
        }

        if (firstStage.template) {
            const templateId = String(firstStage.template);
            const result = await this.templateValidator.validate(templateId, docPath);
            if (!result.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_DOCUMENT,
                    "Document validation failed",
                    400,
                    result
                );
            }
        }

        const skipValidation = { skipValidation: true };
        const calendarId = String(callDoc.calendar);
        let projectId;
        try {
            const createdProj = await this.projectService.create({ ...dto, grant: String(callDoc.grant), calendar: calendarId },
                skipValidation);
            projectId = String(createdProj._id);
            return await this.create({
                project: projectId, stage: String(firstStage._id), documentPath: docPath, userId: userId
            }, skipValidation);

        } catch (error) {
            if (projectId) {
                try {
                    await this.projectService.delete({ id: projectId });
                } catch (rollbackError) {
                    console.error(
                        `Failed to rollback project ${projectId}`,
                        rollbackError
                    );
                }
            }
            throw error;
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
        const applicationDoc = await this.repository.findById(id);
        if (!applicationDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

        const stageDoc = await this.stageRepo.findById(String(applicationDoc.stage));
        if (!stageDoc)
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const approvedReviews = await this.reviewerRepo.find({
            application: id,
            status: ReviewerStatus.approved
        });

        if (approvedReviews.length < stageDoc.minReviewers) {
            throw new AppError(
                ERROR_CODES.INSUFFICIENT_REVIEWS,
                `At least ${stageDoc.minReviewers} completed reviews are required before computing score.`
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
        if (Math.abs((applicationDoc.totalScore ?? 0) - score) > 0.0001) {
            await this.repository.update(id, { totalScore: score });
        }

        return score;
    }

    /**
     * Transition stage status (state machine) use current application
     */
    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const applicationDoc = await this.repository.findById(id);
        if (!applicationDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

        const projectId = String(applicationDoc.project);
        const projectDoc = await this.projectService.getById(projectId);
        if (!projectDoc.currentApplication) {
            throw new AppError(ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND);
        }
        if (String(projectDoc.currentApplication) !== id) {
            throw new AppError(ERROR_CODES.INVALID_APPLICATION);
        }

        const stageId = String(applicationDoc.stage);
        const stageDoc = await this.stageRepo.findById(stageId);
        if (!stageDoc)
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const projStatus = projectDoc.status;

        if (projStatus !== ProjectStatus.draft && projStatus !== ProjectStatus.submitted
            && projStatus !== ProjectStatus.rejected && projStatus !== ProjectStatus.accepted
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        const from = applicationDoc.status as ApplicationStatus;
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
            const totalScore = applicationDoc.totalScore;

            if ((totalScore === undefined || totalScore === null) && stageDoc.minReviewers > 0) {
                throw new AppError(
                    ERROR_CODES.SCORE_NOT_COMPUTED,
                    "Total score not computed. Please calculate score first."
                );
            }

            /*
            const countApproved = await this.reviewerRepo.countByProjectStage(id, ReviewerStatus.approved);

            if (countApproved < stageDoc.minReviewers) {
                throw new AppError(
                    ERROR_CODES.INSUFFICIENT_REVIEWS,
                    `At least ${stageDoc.minReviewers} completed reviews are required before computing score.`
                );
            }
*/
            if (to === ApplicationStatus.accepted) {
                const minAcceptanceScore = stageDoc.minAcceptanceScore ?? 0;
                if ((totalScore ?? 0) < minAcceptanceScore) {
                    throw new AppError(
                        ERROR_CODES.SCORE_BELOW_THRESHOLD,
                        `Cannot accept. Minimum required score is ${minAcceptanceScore}, but got ${totalScore}.`
                    );
                }
            }
        }

        if (to === ApplicationStatus.pending) {

            if (await this.reviewerRepo.exist({ application: id })) {
                throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
            }

        }

        const updated = await this.repository.updateStatus(id, to);

        const synced = await this.synchronizer.sync(projectId);

        if (this.notificationService) {
            const leadUser = String(projectDoc.leadPI);
            const title = projectDoc.title;
            const stageName = stageDoc.name;

            if (to === ApplicationStatus.rejected) {
                await this.notificationService.notifyApplicationRejected(
                    leadUser,
                    title,
                    stageName
                );
            } else if (to === ApplicationStatus.accepted) {
                let nextStageInfo:
                    | { name: string; deadline?: Date }
                    | undefined;

                const nextStage =
                    await this.stageRepo.getNextStage(String(stageDoc.call), stageDoc.order);

                if (nextStage)
                    nextStageInfo = {
                        name: nextStage.name,
                        deadline: nextStage.deadline
                            ? new Date(nextStage.deadline)
                            : undefined
                    };

                await this.notificationService.notifyApplicationAccepted(
                    leadUser,
                    title,
                    stageName,
                    nextStageInfo
                );
            }
            else if (to === ApplicationStatus.pending) {
                await this.notificationService.notifyRollback(
                    leadUser,
                    title,
                    ApplicationStatus.pending,
                    stageName,
                );
            }
        }

        return updated;
    }

    async withdraw(dto: { id: string; userId: string }) {
        const { id, userId } = dto;

        const applicationDoc = await this.repository.findById(id);

        if (!applicationDoc) {
            throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
        }

        if (applicationDoc.status !== ApplicationStatus.pending) {
            throw new AppError(ERROR_CODES.APPLICATION_NOT_PENDING);
        }

        const projectId = String(applicationDoc.project);

        const projectDoc = await this.projectService.getById(projectId);

        // Only project lead can withdraw
        if (String(projectDoc.leadPI) !== String(userId)) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        // Only the current application can be withdrawn
        if (!projectDoc.currentApplication) {
            throw new AppError(
                ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND
            );
        }

        if (String(projectDoc.currentApplication) !== String(id)) {
            throw new AppError(ERROR_CODES.INVALID_APPLICATION);
        }

        // Cannot withdraw once reviewers exist
        if (await this.reviewerRepo.exist({ application: id })) {
            throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
        }

        // All business validation is already done above
        const deleted = await this.delete(
            { id, userId },
            { skipValidation: true }
        );

        if (deleted) {
            await this.notificationService?.notifyApplicationWithdrawn(
                userId,
                projectDoc.title,
                "Last"
            );
        }

        return deleted;
    }

    /**
     * Delete 
     */
    async delete(
        dto: DeleteDto,
        options?: { skipValidation?: boolean }
    ) {
        const { id, userId } = dto;

        const applicationDoc = await this.repository.findById(id);

        if (!applicationDoc) {
            throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
        }

        const projectId = String(applicationDoc.project);

        if (!options?.skipValidation) {
            if (applicationDoc.status !== ApplicationStatus.pending) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_NOT_PENDING
                );
            }

            const projectDoc =
                await this.projectService.getById(projectId);

            if (!projectDoc.currentApplication) {
                throw new AppError(
                    ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND
                );
            }

            if (
                String(projectDoc.currentApplication) !== String(id)
            ) {
                throw new AppError(
                    ERROR_CODES.INVALID_APPLICATION, "This application is not the current application for the project."
                );
            }

            if (
                await this.reviewerRepo.exist({
                    application: id
                })
            ) {
                throw new AppError(
                    ERROR_CODES.REVIEWER_ALREADY_EXISTS
                );
            }
        }

        const deleted = await this.repository.delete(id);

        if (deleted) {
            const synced = await this.synchronizer.sync(projectId);
            if (synced && !synced.currentApplication) {
                await this.projectService.delete({
                    id: projectId
                });
            }
        }
        return deleted;
    }

}

export const PROJECT_STAGE_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.pending]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.pending],
    [ApplicationStatus.rejected]: [ApplicationStatus.pending]
};
