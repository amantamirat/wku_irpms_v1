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
import { CompositionValidationInput, CompositionValidationService } from "../../compositions/composition-validator.service";
import { ConstraintValidationInput, ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { GrantRepository } from "../../grants/grant.repository";
import { NotificationService } from "../../notifications/notification.service";
import { OrganizationRepository } from "../../organization/organization.repository";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { TemplateValidationService } from "../../templates/services/template-validation.service";
import { IUserRepository } from "../../users/user.repository";
import { ICollaboratorRepository } from "../collaborators/collaborator.repository";
import { ProjectAuth } from "../project.auth";
import { IProject, ProjectStatus } from "../project.model";
import { ProjectRepository } from "../project.repository";
import {
    CreateApplicationDTO,
    FilterApplicationDTO,
} from "./application.dto";
import { ApplicationStatus, IApplication } from "./application.model";
import { IApplicationRepository } from "./application.repository";

export class ApplicationService {

    constructor(
        private readonly applicationRepo: IApplicationRepository,
        private readonly projectRepo: ProjectRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly templateValidator: TemplateValidationService,
        private readonly anonymizerService: AnonymizerService,
        private readonly projectAuth: ProjectAuth,
        private readonly notificationService: NotificationService,
        private readonly scopeFilterService: ScopeFilterService,

        private readonly constraintValidator: ConstraintValidationService,
        private readonly compositionValidator: CompositionValidationService,

        private readonly collaboratorRepo: ICollaboratorRepository,
        private readonly userRepo: IUserRepository
    ) {
    }

    async validateCallStage(
        stageId: string,
        documentPath: string,
        projectDoc?: IProject,
        constraintInput?: ConstraintValidationInput,
        compositionInput?: CompositionValidationInput
    ) {
        // --------------------------------------------------
        // Get requested stage
        // --------------------------------------------------

        const stageDoc =
            await this.stageRepo.findById(stageId);

        if (!stageDoc) {
            throw new AppError(
                ERROR_CODES.STAGE_NOT_FOUND
            );
        }

        // --------------------------------------------------
        // Validate project's call
        // --------------------------------------------------

        if (
            projectDoc?.call &&
            String(projectDoc.call) !==
            String(stageDoc.call)
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_STAGE,
                "The application stage does not belong to the project's call."
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


        const callDoc = await this.callRepo.findById(String(stageDoc.call));

        if (!callDoc) {
            throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
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
            if (!projectDoc?.currentApplication) {
                throw new AppError(
                    ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND,
                    "Project does not have a current application."
                );
            }
            // --------------------------------------------------
            // Get current application
            // --------------------------------------------------
            const currentAppDoc =
                await this.applicationRepo.findById(
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


        if (callDoc.constraint) {
            let result;
            if (projectDoc?._id) {
                result =
                    await this.constraintValidator.
                        validateProjectById(String(callDoc.constraint), String(projectDoc._id));
            }
            if (constraintInput) {
                result =
                    await this.constraintValidator
                        .validateProject(String(callDoc.constraint), constraintInput);
            }

            if (!result?.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_CONSTRAINT,
                    "Constraint validation failed",
                    400,
                    result
                );
            }

        }


        if (callDoc.composition) {

            let result;
            if (projectDoc?._id) {
                result =
                    await this.compositionValidator.validateByProjectId(
                        String(callDoc.composition),
                        String(projectDoc._id)
                    );
            }
            if (compositionInput) {
                result =
                    await this.compositionValidator
                        .validate(String(callDoc.composition), callDoc, compositionInput);
            }

            if (!result?.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_COMPOSITION,
                    "Document validation failed",
                    400,
                    result
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
        return { stageDoc: stageDoc }

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
        // Authorization + project
        // --------------------------------------------------
        const {
            projectDoc
        } = await this.projectAuth.auth(
            project,
            userId,
            PERMISSIONS.APPLICATION.CREATE
        );

        const { stageDoc } =
            await this.validateCallStage(stage, documentPath, projectDoc);

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
                await this.applicationRepo.create(
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

    async readApplications(
        filter: FilterApplicationDTO,
        //userId: string,
        scope: AuthScope,
        options?: FilterOptions
    ) {
        const scopeFilter =
            await this.scopeFilterService.getApplicationFilter(scope);
        return await this.applicationRepo.find(filter, options, scopeFilter);
    }

    /**
     * Get project applications
     */
    async get(dto: FilterApplicationDTO, options?: FilterOptions) {
        return await this.applicationRepo.find(dto, options);
    }

    /**
     * Get by ID
     */
    async getById(id: string) {
        const appDoc = await this.applicationRepo.findById(id);
        if (!appDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
        return appDoc;
    }

    getMyAssignedApplications = async (
        userId: string,
        filter?: FilterApplicationDTO,
        options?: FilterOptions
    ) => {
        return this.applicationRepo.find(
            {
                ...filter,
                reviewerAssigner: userId
            },
            options
        );
    };


    /**
     * Get by ID
     */
    async anonymizeApplication(id: string) {
        return await this.anonymizerService.anonymizeApplication(id);
    }

    /**
     * Update stage 
     */
    async update(dto: any) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
    }


    public async updateReviewerAssigner(
        applicationId: string,
        reviewerAssigner: string | null,
        userId: string
    ): Promise<IApplication> {

        const applicationDoc =
            await this.applicationRepo.findById(applicationId);

        if (!applicationDoc) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND
            );
        }

        if (applicationDoc.status !== ApplicationStatus.shortlisted) {
            throw new AppError(
                ERROR_CODES.INVALID_APPLICATION_STATUS,
                "The application must be shortlisted before a reviewer assigner can be assigned."
            );
        }

        let reviewerAssignerDoc: any = null;

        // Validate the new reviewer assigner
        if (reviewerAssigner) {
            reviewerAssignerDoc =
                await this.userRepo.findById(reviewerAssigner);

            if (!reviewerAssignerDoc) {
                throw new AppError(
                    ERROR_CODES.USER_NOT_FOUND
                );
            }

            const isCollaborator =
                await this.collaboratorRepo.exists({
                    project: String(applicationDoc.project),
                    member: reviewerAssigner
                });

            if (isCollaborator) {
                throw new AppError(
                    ERROR_CODES.INVALID_REVIEWER,
                    `User ${reviewerAssignerDoc.name ?? reviewerAssigner} is already a member in the project.`
                );
            }
        }

        const previousReviewerAssigner =
            applicationDoc.reviewerAssigner
                ? String(applicationDoc.reviewerAssigner)
                : null;

        const updatedApplication =
            await this.applicationRepo.update(
                applicationId,
                {
                    reviewerAssigner
                },
                userId
            );

        if (!updatedApplication) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND
            );
        }

        // Nothing else to notify when the value did not actually change.
        if (
            previousReviewerAssigner ===
            (reviewerAssigner ? String(reviewerAssigner) : null)
        ) {
            return updatedApplication;
        }

        const projectDoc =
            await this.projectRepo.findById(
                String(applicationDoc.project)
            );

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }

        const stageDoc =
            await this.stageRepo.findById(
                String(applicationDoc.stage)
            );

        if (!stageDoc) {
            throw new AppError(
                ERROR_CODES.STAGE_NOT_FOUND
            );
        }

        // New reviewer assigner
        if (reviewerAssigner) {
            await this.notificationService.notifyReviewerAssigner(
                reviewerAssigner,
                projectDoc.title,
                stageDoc.name,
                userId
            );
        }

        // Previous reviewer assigner was removed/replaced.
        if (
            previousReviewerAssigner &&
            previousReviewerAssigner !== String(reviewerAssigner)
        ) {
            await this.notificationService.notifyReviewerAssignerRemoved(
                previousReviewerAssigner,
                projectDoc.title,
                stageDoc.name,
                userId
            );
        }

        return updatedApplication;
    }



    /**
     * Transition stage status (state machine) use current application
     */
    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next } = dto;

        const applicationDoc = await this.applicationRepo.findById(id);

        if (!applicationDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

        const projectDoc = await this.projectRepo.findById(String(applicationDoc.project));

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }

        if (projectDoc.status !== ProjectStatus.draft) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
        }

        if (
            !projectDoc.currentApplication ||
            String(projectDoc.currentApplication) !== id
        ) {
            throw new AppError(
                ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND,
                "This application is not the current application for the project."
            );
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

        if (to === ApplicationStatus.shortlisted) {
            const hasUnverified =
                await this.collaboratorRepo.existsUnverified(
                    String(applicationDoc.project)
                );

            if (hasUnverified) {
                throw new AppError(
                    ERROR_CODES.COLLABORATORS_NOT_FULLY_VERIFIED,
                    'All project collaborators must be verified before reviewers can be assigned.'
                );
            }
        }
        else if (to === ApplicationStatus.submitted) {
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

        const stageDoc = await this.stageRepo.findById(String(applicationDoc.stage));

        if (!stageDoc)
            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        if (
            to === ApplicationStatus.accepted ||
            to === ApplicationStatus.rejected
        ) {

            if (!applicationDoc.totalScore) {
                throw new AppError(
                    ERROR_CODES.SCORE_NOT_COMPUTED
                );
            }

            if (to === ApplicationStatus.accepted) {
                const minAcceptanceScore = stageDoc.minAcceptanceScore ?? 0;
                if (applicationDoc.totalScore < minAcceptanceScore) {
                    throw new AppError(
                        ERROR_CODES.SCORE_BELOW_THRESHOLD,
                        `Application cannot be accepted. Minimum required score: ${minAcceptanceScore}; actual score: ${applicationDoc.totalScore}.`);
                }

            }
        }

        const updated = await this.applicationRepo.updateStatus(id, to, userId);


        if (this.notificationService) {
            const leadUser = String(projectDoc.leadPI);
            const title = projectDoc.title;
            const stageName = stageDoc.name;

            if (to === ApplicationStatus.shortlisted) {
                await this.notificationService.notifyApplicationShortlisted(
                    leadUser,
                    title,
                    stageName
                );
            }

            else if (to === ApplicationStatus.rejected) {
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
            else if (to === ApplicationStatus.submitted) {
                await this.notificationService.notifyRollback(
                    leadUser,
                    title,
                    ApplicationStatus.submitted,
                    stageName,
                );
            }
        }

        return updated;
    }

    /**
     * Delete 
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
            await this.applicationRepo.findById(id);

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
            ApplicationStatus.submitted
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_APPLICATION_STATUS, "Application is not in submitted state"
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
                ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND,
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
                await this.applicationRepo.findOne({
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
            await this.applicationRepo.delete(id);

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


export const APPLICATION_TRANSITIONS: Record<
    ApplicationStatus,
    ApplicationStatus[]
> = {
    [ApplicationStatus.submitted]: [
        ApplicationStatus.shortlisted,
        ApplicationStatus.notShortlisted
    ],

    [ApplicationStatus.shortlisted]: [
        ApplicationStatus.submitted,
        ApplicationStatus.accepted,
        ApplicationStatus.rejected
    ],

    [ApplicationStatus.notShortlisted]: [
        ApplicationStatus.submitted
    ],

    [ApplicationStatus.accepted]: [
        ApplicationStatus.shortlisted
    ],

    [ApplicationStatus.rejected]: [
        ApplicationStatus.shortlisted
    ]
};