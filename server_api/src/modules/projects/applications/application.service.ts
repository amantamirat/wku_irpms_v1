import { console } from "inspector";
import { PERMISSIONS } from "../../../common/constants/permissions";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { AnonymizerService } from "../../../util/anonymizer/anonymizer.service";
import { AuthPermissionService } from "../../auth/auth.permission-service";
import { ICallRepository } from "../../calls/call.repository";
import { IStage } from "../../calls/stages/stage.model";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { TemplateValidationService } from "../../templates/services/template-validation.service";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import {
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
        private readonly projectRepo: IProjectRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly templateValidator: TemplateValidationService,
        private readonly synchronizer: ApplicationSynchronizer,
        private readonly anonymizerService: AnonymizerService,
        private readonly projectAuth: ProjectAuth,
        private readonly notificationService: NotificationService,
    ) {
    }

    /**
 * Create an application
 *
 * Creates the first application when the project has no current
 * application, otherwise creates the next-stage application.
 */
    async create(
        dto: CreateApplicationDTO,
        userId: string
        /*
        options?: {
            skipValidation?: boolean;
        }*/
    ) {

        const projectDoc =
            await this.projectRepo.findById(dto.project);

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }

        // --------------------------------------------------
        // Authorization
        // --------------------------------------------------
        //if (!options?.skipValidation) {

        await this.projectAuth.auth(dto.project, userId, PERMISSIONS.APPLICATION.CREATE);

        //}

        // --------------------------------------------------
        // Decide first or next application
        // --------------------------------------------------

        if (!projectDoc.currentApplication) {
            return this.createFirstApplication(
                dto,
                userId
                //,options
            );
        }

        return this.createNextApplication(
            dto,
            userId
        );
    }

    /**
 * Create the first application for a project.
 */
    async createFirstApplication(
        dto: CreateApplicationDTO,
        userId: string,
        options?: {
            skipValidation?: boolean;
        }
    ) {
        if (!options?.skipValidation) {

            const projectDoc =
                await this.projectRepo.findById(dto.project);

            if (!projectDoc) {
                throw new AppError(
                    ERROR_CODES.PROJECT_NOT_FOUND
                );
            }

            if (projectDoc.currentApplication) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_ALREADY_EXISTS,
                    "The project already has an application."
                );
            }

            const stageDoc =
                await this.stageRepo.findById(dto.stage);

            if (!stageDoc) {
                throw new AppError(
                    ERROR_CODES.STAGE_NOT_FOUND
                );
            }

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

            if (stageDoc.order !== 1) {
                throw new AppError(
                    ERROR_CODES.INVALID_STAGE,
                    "The first application must use the first stage."
                );
            }

            await this.validateStage(
                stageDoc,
                dto.documentPath
            );
        }

        return this.internalCreate(
            dto,
            userId
        );
    }

    /**
     * * Create an application for the next project stage.
     * */
    private async createNextApplication(
        dto: CreateApplicationDTO,
        userId: string
    ) {
        const {
            project,
            stage,
            documentPath
        } = dto;

        const projectDoc =
            await this.projectRepo.findById(project);

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }

        if (!projectDoc.call) {
            throw new AppError(
                ERROR_CODES.CALL_NOT_FOUND
            );
        }

        const callId = String(projectDoc.call);

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
        // Current application
        // --------------------------------------------------

        if (!projectDoc.currentApplication) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_FOUND,
                "Project does not have a current application."
            );
        }

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
        // Current application must be accepted
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

        // --------------------------------------------------
        // Get current stage
        // --------------------------------------------------

        const currentStage =
            await this.stageRepo.findById(
                String(currentAppDoc.stage)
            );

        if (!currentStage) {
            throw new AppError(
                ERROR_CODES.STAGE_NOT_FOUND
            );
        }

        // --------------------------------------------------
        // Requested stage must be next stage
        // --------------------------------------------------

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

        // --------------------------------------------------
        // Validate stage requirements
        // --------------------------------------------------

        await this.validateStage(
            stageDoc,
            documentPath
        );

        return this.internalCreate(
            dto,
            userId
        );
    }

    private async internalCreate(
        dto: CreateApplicationDTO,
        userId: string
    ) {
        try {
            //console.log("BEFORE CREATION APPLICATION");
            const created =
                await this.repository.create(dto, userId);

            const projectDoc =
                await this.projectRepo.findById(dto.project);

            const stageDoc =
                await this.stageRepo.findById(dto.stage);

            // First application may establish the project's call
            if (
                projectDoc &&
                stageDoc

            ) {

                if (!projectDoc.call &&
                    stageDoc.call) {
                    await this.projectRepo.update(
                        dto.project,
                        {
                            call: String(stageDoc.call)
                        }
                    );
                }

            }

            // currentApplication synchronized
            await this.synchronizer.sync(dto.project);

            //console.log("BEFORE NOTIFICATION AFTER CREATION APPLICATION");
            if (
                projectDoc &&
                stageDoc
            ) {

                await this.notificationService
                    .notifyApplicationSubmitted(
                        String(projectDoc.leadPI),
                        projectDoc.title,
                        stageDoc.name
                    );
            }

            // Fire and forget
            this.anonymizerService.anonymizeApplication(
                String(created._id)
            );

            return created;

        } catch (err: any) {

            if (err?.code === 11000) {
                throw new AppError(
                    ERROR_CODES.APPLICATION_ALREADY_EXISTS
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
    async delete(dto: DeleteDto, userId: string) {
        const { id } = dto;

        const applicationDoc = await this.repository.findById(id);

        if (!applicationDoc) {
            throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
        }

        const projectId = String(applicationDoc.project);



        if (applicationDoc.status !== ApplicationStatus.pending) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_PENDING
            );
        }

        const { projectDoc } = await this.projectAuth.auth(projectId, userId, PERMISSIONS.PROJECT.DELETE);

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


        const deleted = await this.repository.delete(id);

        if (deleted) {
            const synced = await this.synchronizer.sync(projectId);
        }
        return deleted;
    }

}

export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    [ApplicationStatus.pending]: [ApplicationStatus.accepted, ApplicationStatus.rejected],
    [ApplicationStatus.accepted]: [ApplicationStatus.pending],
    [ApplicationStatus.rejected]: [ApplicationStatus.pending]
};
