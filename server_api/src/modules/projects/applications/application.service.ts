import { DeleteDto } from "../../../common/dtos/delete.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { CallStatus } from "../../calls/call.model";
import { ICallRepository } from "../../calls/call.repository";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
//import { CompositionValidator } from "../../compositions/composition.validator";
import { GrantStatus } from "../../grants/grant.model";
import { IGrantRepository } from "../../grants/grant.repository";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { TemplateValidationService } from "../../templates/services/template-validation.service";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import { IProjectRepository } from "../project.repository";
import { ProjectService } from "../project.service";
import {
    ApplyProjectDTO,
    CreateApplicationDTO,
    GetApplicationDTO,
    UpdateApplicationDTO
} from "./application.dto";
import { ApplicationStatus } from "./application.model";
import { IApplicationRepository } from "./application.repository";
import { ApplicationSynchronizer as ProjectSynchronizer } from "./application.synchronizer";

export class ApplicationService {

    constructor(
        private readonly repository: IApplicationRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly projectService: ProjectService,
        //private readonly constValidator: ConstraintValidatorOLD,
        //private readonly compValidator: CompositionValidator,
        private readonly constraintValidator: ConstraintValidationService,
        private readonly templateValidator: TemplateValidationService,
        private readonly synchronizer = new ProjectSynchronizer(projectRepo, repository, stageRepo),
        private readonly notificationService?: NotificationService,
        private readonly projAuth: ProjectAuth = new ProjectAuth(projectRepo),


    ) {
    }

    async getProject(id: string): Promise<any> {
        const projectDoc = await this.projectRepo.findById(id);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        return projectDoc;
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
        const { project, documentPath, userId } = dto;
        if (!options?.skipValidation) {
            const projectDoc = await this.getProject(project);
            const callId = String(projectDoc.call);
            const count = await this.repository.countByProject(project);
            let nextOrder = count + 1;
            const nextStageDoc = await this.stageRepo.findOne(callId, nextOrder);
            if (!nextStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            const deadline = nextStageDoc.deadline;
            if (deadline < new Date()) {
                throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);
            }

            if (nextStageDoc.template) {
                const templateId = String(nextStageDoc.template);
                const result = await this.templateValidator.validate(templateId, documentPath);
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
                await this.notificationService.notifyStatusChange(
                    userId,
                    "Project",
                    "Stage",
                    ApplicationStatus.pending,
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



    async apply(dto: ApplyProjectDTO) {
        const { call, title, summary, leadPI, collaborators, phases, themes, userId, docPath } = dto;
        const lead = collaborators.find(c => c.isLeadPI);
        if (!lead) throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        if (lead.member !== userId) throw new AppError(ERROR_CODES.UNAUTHORIZED);

        const callDoc = await this.callRepo.findById(call);
        if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);
        const deadline = callDoc.deadline;
        if (!deadline) {
            throw new AppError(ERROR_CODES.CALL_DEADLINE_NOT_SET);
        }
        if (deadline < new Date()) {
            throw new AppError(ERROR_CODES.CALL_DEADLINE_PASSED);
        }

        const stageDoc = await this.stageRepo.findOne(String(callDoc._id), 1);
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        const stageDeadline = stageDoc.deadline;
        if (stageDeadline < new Date()) {
            throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);
        }

        const grantId = String(callDoc.grant);
        const grantDoc = await this.grantRepo.findById(grantId);
        if (!grantDoc) throw new Error(ERROR_CODES.GRANT_NOT_FOUND);
        if (grantDoc.status !== GrantStatus.active) throw new Error(ERROR_CODES.GRANT_NOT_ACTIVE);

        if (grantDoc.constraint) {
            const constraintId = String(grantDoc.constraint);
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

        if (stageDoc.template) {
            const templateId = String(stageDoc.template);
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

        // await this.constValidator.validateAll(grantId, { participantCount: collaborators.length, phases, themes, title, summary });
        // await this.compValidator.validateAll(grantId, collaborators);
        const skipValidation = { skipValidation: true };
        const calendarId = String(callDoc.calendar);
        const createdProj = await this.projectService.create({ ...dto, grant: grantId, calendar: calendarId },
            skipValidation);
        const projectId = String(createdProj._id);
        return await this.create({
            project: projectId, stage: String(stageDoc._id), documentPath: docPath, userId: userId
        }, skipValidation);
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

        const grantStageDoc = projStageDoc.stage as unknown as any;

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

            const grantStageDoc = projStageDoc.stage as unknown as any;

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

        if (to === ApplicationStatus.pending) {
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
        const { id, userId } = dto;
        const appDoc = await this.repository.findById(id);
        if (!appDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);
        if (appDoc.status !== ApplicationStatus.pending) throw new AppError(ERROR_CODES.APPLICATION_NOT_PENDING);

        if (await this.reviewerRepo.exist({ projectApplication: id })) {
            throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
        }

        const project = String(appDoc.project);
        //await this.validateProject(project, userId ?? "");


        const deleted = await this.repository.delete(id);
        if (deleted) {
            const stageDoc = await this.stageRepo.findById(String(appDoc.stage));
            await this.synchronizer.sync(project);
            if (stageDoc?.order === 1) {
                await this.projectService.delete({ id: project });
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
