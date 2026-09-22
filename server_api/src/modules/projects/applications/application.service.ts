import { Unit } from "../../../common/constants/enums";
import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { AnonymizerService } from "../../../util/anonymizer/anonymizer.service";
import { AuthPermissionService } from "../../auth/auth.permission-service";
import { AuthScope } from "../../auth/auth.types";
import ScopeFilterService from "../../auth/scope-filter.service";
import { ICallRepository } from "../../calls/call.repository";
import { IStage } from "../../calls/stages/stage.model";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { GrantRepository } from "../../grants/grant.repository";
import { NotificationService } from "../../notifications/notification.service";
import { OrganizationRepository } from "../../organization/organization.repository";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { TemplateValidationService } from "../../templates/services/template-validation.service";
import { ProjectAuth } from "../project.auth";
import { IProject, ProjectStatus } from "../project.model";
import { ProjectRepository } from "../project.repository";
import {
    CreateApplicationDTO,
    FilterApplicationDTO,
    UpdateApplicationDTO
} from "./application.dto";
import { ApplicationStatus, IApplication } from "./application.model";
import { IApplicationRepository } from "./application.repository";

export class ApplicationService {

    constructor(
        private readonly repository: IApplicationRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly templateValidator: TemplateValidationService,
        private readonly anonymizerService: AnonymizerService,
        private readonly projectAuth: ProjectAuth,
        private readonly notificationService: NotificationService,
        private readonly scopeFilterService: ScopeFilterService,
    ) {
    }

    /**
 * Create a new application for a project stage.
 */
    async create(
        dto: CreateApplicationDTO,
        userId: string
    ) {
        const {
            project,
            stage,
            documentPath
        } = dto;

        // --------------------------------------------------
        // Get requested stage
        // --------------------------------------------------

        const stageDoc =
            await this.stageRepo.findById(stage);

        if (!stageDoc) {
            throw new AppError(
                ERROR_CODES.STAGE_NOT_FOUND
            );
        }

        // --------------------------------------------------
        // Stage deadline
        // --------------------------------------------------

        if (
            new Date(stageDoc.deadline) < new Date()
        ) {
            throw new AppError(
                ERROR_CODES.STAGE_DEADLINE_PASSED
            );
        }

        // --------------------------------------------------
        // Authorization + project
        // --------------------------------------------------

        const {
            projectDoc
        } = await this.projectAuth.auth(
            project,
            userId,
            PERMISSIONS.APPLICATION.CREATE
        );

        // --------------------------------------------------
        // Validate project's call
        // --------------------------------------------------

        if (projectDoc.call) {

            if (
                !stageDoc.call ||
                String(projectDoc.call) !==
                String(stageDoc.call)
            ) {
                throw new AppError(
                    ERROR_CODES.INVALID_STAGE,
                    "The application stage does not belong to the project's call."
                );
            }
        }

        // --------------------------------------------------
        // Check previous stage
        // --------------------------------------------------

        const previousStage =
            await this.stageRepo.findPreviousStage(
                String(stageDoc.call),
                stageDoc.order
            );

        if (previousStage) {
            // --------------------------------------------------
            // Project must have a current application
            // --------------------------------------------------

            if (!projectDoc.currentApplication) {
                throw new AppError(
                    ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND,
                    "Project does not have a current application."
                );
            }

            // --------------------------------------------------
            // Get current application
            // --------------------------------------------------

            const currentAppDoc =
                await this.repository.findById(
                    String(projectDoc.currentApplication)
                );

            if (!currentAppDoc) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_NOT_FOUND
                );
            }

            // --------------------------------------------------
            // Current application must be at previous stage
            // --------------------------------------------------

            if (
                String(currentAppDoc.stage) !==
                String(previousStage._id)
            ) {
                throw new AppError(
                    ERROR_CODES.INVALID_STAGE,
                    "The project is not currently at the required previous stage."
                );
            }

            // --------------------------------------------------
            // Previous application must be accepted
            // --------------------------------------------------

            if (
                currentAppDoc.status !==
                ApplicationStatus.accepted
            ) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_NOT_ACCEPTED,
                    "The current application must be accepted before proceeding."
                );
            }
        }

        // --------------------------------------------------
        // Validate document against stage template
        // --------------------------------------------------

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

        // --------------------------------------------------
        // Create application
        // --------------------------------------------------
        return this.internalCreate(
            dto,
            userId,
            projectDoc,
            stageDoc
        );
    }

    /**
 * Internal application creation.
 *
 * Assumes all business validations have already
 * been completed by the caller.
 */
    async internalCreate(
        dto: CreateApplicationDTO,
        userId: string,
        projectDoc: IProject,
        stageDoc: IStage
    ): Promise<IApplication> {

        try {
            // --------------------------------------------------
            // Create application
            // --------------------------------------------------
            const created =
                await this.repository.create(
                    dto,
                    userId
                );

            // --------------------------------------------------
            // Update project
            //
            // Always point to the newly created application.
            // First application also establishes the project's call.
            // --------------------------------------------------

            const projectUpdate: any = {
                currentApplication:
                    String(created._id)
            };

            if (
                !projectDoc.call &&
                stageDoc.call
            ) {
                projectUpdate.call =
                    String(stageDoc.call);
            }

            await this.projectRepo.update(
                dto.project,
                projectUpdate
            );

            // --------------------------------------------------
            // Notification
            // --------------------------------------------------

            await this.notificationService
                .notifyApplicationSubmitted(
                    userId,
                    projectDoc.title,
                    stageDoc.name
                );

            // --------------------------------------------------
            // Anonymize document
            // --------------------------------------------------

            // Fire and forget
            this.anonymizerService
                .anonymizeApplication(
                    String(created._id)
                );

            return created;

        } catch (err: any) {

            // MongoDB duplicate key
            if (err?.code === 11000) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_ALREADY_EXISTS
                );
            }

            throw err;
        }
    }



    async read(
        filter: FilterApplicationDTO,
        userId: string,
        scope: AuthScope,
        options?: FilterOptions
    ) {
        const scopeFilter =
            await this.scopeFilterService.getApplicationFilter(scope);
        return await this.repository.find(filter, options, scopeFilter);
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
    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next } = dto;

        const applicationDoc = await this.repository.findById(id);
        if (!applicationDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

        const projectId = String(applicationDoc.project);
        const projectDoc = await this.projectRepo.findById(projectId);

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }
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

        if (projStatus !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
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

        const updated = await this.repository.updateStatus(id, to, userId);

        //const synced = await this.synchronizer.sync(projectId);

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

    /**
     * Delete 
     */
    /**
 * Delete the current pending application.
 */
    async delete(
        dto: DeleteDto,
        userId: string
    ) {
        const { id } = dto;

        // --------------------------------------------------
        // Get application
        // --------------------------------------------------

        const applicationDoc =
            await this.repository.findById(id);

        if (!applicationDoc) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND
            );
        }

        const projectId =
            String(applicationDoc.project);

        // --------------------------------------------------
        // Only pending applications can be deleted
        // --------------------------------------------------

        if (
            applicationDoc.status !==
            ApplicationStatus.pending
        ) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_PENDING
            );
        }

        // --------------------------------------------------
        // Authorization + project
        // --------------------------------------------------

        const { projectDoc } =
            await this.projectAuth.auth(
                projectId,
                userId,
                PERMISSIONS.APPLICATION.DELETE
            );

        // --------------------------------------------------
        // Application must be the current application
        // --------------------------------------------------

        if (
            !projectDoc.currentApplication ||
            String(projectDoc.currentApplication) !==
            String(id)
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_APPLICATION_STATUS,
                "This application is not the current application for the project."
            );
        }

        // --------------------------------------------------
        // Application must not have reviewers
        // --------------------------------------------------

        if (
            await this.reviewerRepo.exists({
                application: id
            })
        ) {
            throw new AppError(
                ERROR_CODES.REVIEWER_ALREADY_EXISTS
            );
        }

        // --------------------------------------------------
        // Get current stage
        // --------------------------------------------------

        const currentStage =
            await this.stageRepo.findById(
                String(applicationDoc.stage)
            );

        if (!currentStage) {
            throw new AppError(
                ERROR_CODES.STAGE_NOT_FOUND
            );
        }

        // --------------------------------------------------
        // Find previous stage
        // --------------------------------------------------

        const previousStage =
            await this.stageRepo.findPreviousStage(
                String(currentStage.call),
                currentStage.order
            );

        let previousApplicationId:
            string | null = null;

        // --------------------------------------------------
        // Find previous application
        // --------------------------------------------------

        if (previousStage) {

            const previousApplication =
                await this.repository.findOne({
                    project: projectId,
                    stage: String(previousStage._id)
                });

            if (!previousApplication) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_NOT_FOUND,
                    "The previous stage application could not be found."
                );
            }

            previousApplicationId =
                String(previousApplication._id);
        }

        // --------------------------------------------------
        // Delete current application
        // --------------------------------------------------

        const deleted =
            await this.repository.delete(id);

        if (!deleted) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND
            );
        }

        // --------------------------------------------------
        // Restore project current application
        //
        // Previous stage exists:
        //     currentApplication = previous application
        //
        // First stage:
        //     currentApplication = null
        // --------------------------------------------------

        await this.projectRepo.update(
            projectId,
            {
                currentApplication:
                    previousApplicationId
            }
        );

        return deleted;
    }

}

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.pending]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.pending],
    [ApplicationStatus.rejected]: [ApplicationStatus.pending]
};
