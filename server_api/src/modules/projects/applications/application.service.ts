import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { AnonymizerService } from "../../anonymizer/anonymizer.service";
import { CallStatus } from "../../calls/call.model";
import { ICallRepository } from "../../calls/call.repository";
import { IStage } from "../../calls/stages/stage.model";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { TemplateValidationService } from "../../templates/services/template-validation.service";
import { IProject, ProjectStatus } from "../project.model";
import { ProjectService } from "../project.service";
import {
    ApplyProjectDTO,
    CreateApplicationDTO,
    FilterApplicationDTO,
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
        private readonly anonymizerService: AnonymizerService,
        private readonly notificationService?: NotificationService,
    ) {
    }

    /**
 * Create application for the next project stage
 */
    async createNextApplication(
        dto: CreateApplicationDTO
    ) {
        const {
            project,
            stage,
            documentPath
        } = dto;

        // Get project
        const projectDoc =
            await this.projectService.getById(project);

        if (!projectDoc.call) {
            throw new AppError(
                ERROR_CODES.CALL_NOT_FOUND
            );
        }

        const callId = String(projectDoc.call);

        // Get requested stage
        const stageDoc =
            await this.stageRepo.findById(stage);

        if (!stageDoc) {
            throw new AppError(
                ERROR_CODES.STAGE_NOT_FOUND
            );
        }

        // A next-stage application requires
        // an existing current application
        if (!projectDoc.currentApplication) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND,
                "Project does not have a current application."
            );
        }

        const currentApp =
            await this.repository.findById(
                String(projectDoc.currentApplication)
            );

        if (!currentApp) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND
            );
        }

        // Current application must be accepted
        if (
            currentApp.status !==
            ApplicationStatus.accepted
        ) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_ACCEPTED,
                "The current application must be accepted before proceeding."
            );
        }

        // Get current application's stage
        const currentStage =
            await this.stageRepo.findById(
                String(currentApp.stage)
            );

        if (!currentStage) {
            throw new AppError(
                ERROR_CODES.STAGE_NOT_FOUND
            );
        }

        // Requested stage must be the next stage
        const expectedNextStage =
            await this.stageRepo.getNextStage(
                callId,
                currentStage.order
            );

        if (
            !expectedNextStage ||
            String(expectedNextStage._id) !==
            String(stage)
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_STAGE,
                "The provided stage is not the valid next stage for this project."
            );
        }

        // Common stage validation
        await this.validateStage(
            stageDoc,
            documentPath
        );

        // Actual creation
        return this.internalCreate(
            dto,
            projectDoc,
            stageDoc
        );
    }


    /**
 * Apply to a call and create the project's first application
 */
    async apply(dto: ApplyProjectDTO) {

        const {
            call,
            userId,
            collaborators,
            docPath
        } = dto;

        // Validate lead PI
        const lead = collaborators.find(
            c => c.isLeadPI
        );

        if (!lead) {
            throw new AppError(
                ERROR_CODES.LEAD_PI_NOT_FOUND
            );
        }

        if (lead.member !== userId) {
            throw new AppError(
                ERROR_CODES.UNAUTHORIZED
            );
        }

        // Validate call
        const callDoc =
            await this.callRepo.findById(call);

        if (!callDoc) {
            throw new AppError(
                ERROR_CODES.CALL_NOT_FOUND
            );
        }

        if (callDoc.status !== CallStatus.active) {
            throw new AppError(
                ERROR_CODES.CALL_NOT_ACTIVE
            );
        }

        // Get first stage
        const firstStage =
            await this.stageRepo.getFirstStage(call);

        if (!firstStage) {
            throw new AppError(
                ERROR_CODES.FIRST_STAGE_NOT_FOUND
            );
        }

        // Validate project constraints
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
        // Validate first-stage requirements
        await this.validateStage(
            firstStage,
            docPath
        );

        // Create project + first application
        let projectDoc: IProject | undefined;

        try {

            projectDoc =
                await this.projectService.create({
                    ...dto,
                    grant: String(callDoc.grant),
                    calendar: String(callDoc.calendar)
                },
                    { skipValidation: true });

            return await this.internalCreate(
                {
                    project: String(projectDoc._id),
                    stage: String(firstStage._id),
                    documentPath: docPath,
                    userId
                },
                projectDoc,
                firstStage
            );

        } catch (error) {

            if (projectDoc?._id) {

                try {
                    await this.projectService.delete({
                        id: String(projectDoc._id)
                    });
                } catch (rollbackError) {
                    console.error(
                        `Failed to rollback project ${projectDoc._id}`,
                        rollbackError
                    );
                }
            }

            throw error;
        }
    }



    private async internalCreate(
        dto: CreateApplicationDTO,
        projectDoc: IProject,
        stageDoc: IStage
    ) {
        try {
            const created = await this.repository.create(dto);

            await this.synchronizer.sync(
                String(projectDoc._id)
            );

            if (this.notificationService) {
                await this.notificationService
                    .notifyApplicationSubmitted(
                        String(projectDoc.leadPI),
                        projectDoc.title,
                        stageDoc.name
                    );
            }

            // no await here
            this.anonymizerService.anonymizeApplication(String(created._id));

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


    private async validateStage(
        stageDoc: IStage,
        documentPath: string
    ): Promise<void> {

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

    /**
     * Get project applications
     */
    async get(dto: FilterApplicationDTO, options?: FilterOptions) {
        return await this.repository.find(dto, options);
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
     * Get by ID
     */
    async anonymizeApplication(id: string) {
        return await this.anonymizerService.anonymizeApplication(id);
    }

    /**
     * Update stage 
     */
    async update(dto: UpdateApplicationDTO) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
    }


    private async calculateTotalScore(id: string): Promise<number> {
        //const applicationDoc = await this.repository.findById(id);
        /*
                if (!applicationDoc) {
                    throw new AppError(
                        ERROR_CODES.APPLICATION_NOT_FOUND
                    );
                }
        */
        const approvedReviews =
            await this.reviewerRepo.find({
                application: id,
                status: ReviewerStatus.approved
            });

        const totalWeight = approvedReviews.reduce(
            (sum, review) =>
                sum + (review.weight ?? 1),
            0
        );

        if (totalWeight === 0) {
            await this.repository.update(id, {
                totalScore: 0
            });

            return 0;
        }

        const score =
            approvedReviews.reduce(
                (sum, review) =>
                    sum +
                    (review.score ?? 0) *
                    (review.weight ?? 1),
                0
            ) / totalWeight;

        await this.repository.update(id, {
            totalScore: score
        });

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
            throw new AppError(ERROR_CODES.INVALID_APPLICATION_STATUS);
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
            APPLICATION_TRANSITIONS
        );
        if (
            to === ApplicationStatus.accepted ||
            to === ApplicationStatus.rejected
        ) {
            const approvedCount =
                await this.reviewerRepo.count({ application: id, status: ReviewerStatus.approved });
            if (
                approvedCount <
                stageDoc.minReviewers
            ) {
                throw new AppError(
                    ERROR_CODES.INSUFFICIENT_REVIEWS,
                    `At least ${stageDoc.minReviewers} approved reviews are required before computing score.`
                );
            }
            const totalScore = await this.calculateTotalScore(id);
            // const totalScore = applicationDoc.totalScore;

            /*
            if ((totalScore === undefined || totalScore === null) ) {
                throw new AppError(
                    ERROR_CODES.SCORE_NOT_COMPUTED,
                    "Total score not computed. Please calculate score first."
                );
            }*/
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
        /*
        if (to === ApplicationStatus.pending) {
        }*/
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

        const projectDoc = await this.projectService.getById(String(applicationDoc.project));

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
            throw new AppError(ERROR_CODES.INVALID_APPLICATION_STATUS);
        }

        // Cannot withdraw once reviewers exist
        if (await this.reviewerRepo.exists({ application: id })) {
            throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
        }

        // All business validation is already done above
        const deleted = await this.delete(
            { id, userId },
            { skipValidation: true }
        );

        if (deleted) {
            const stageDoc = await this.stageRepo.findById(String(applicationDoc.stage));
            stageDoc && await this.notificationService?.notifyApplicationWithdrawn(
                userId,
                projectDoc.title,
                stageDoc?.name
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
                    ERROR_CODES.INVALID_APPLICATION_STATUS, "This application is not the current application for the project."
                );
            }

            if (
                await this.reviewerRepo.exists({
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

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.pending]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.pending],
    [ApplicationStatus.rejected]: [ApplicationStatus.pending]
};
