import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { AuthPermissionService } from "../auth/auth.permission-service";
import { IStageRepository } from "../calls/stages/stage.repository";
import { IVerificationConfigurationRepository } from "../grants/verification-conf/verification-conf.repository";
import { VerificationStatus } from "../grants/verifications/verification.model";
import { IVerificationRepository } from "../grants/verifications/verification.repository";
import { ApplicationStatus } from "../projects/applications/application.model";
import { IApplicationRepository } from "../projects/applications/application.repository";
import { ApplicationService } from "../projects/applications/application.service";
import { ICollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { IProject } from "../projects/project.model";
import { IProjectRepository } from "../projects/project.repository";
import { IUserRepository } from "../users/user.repository";
import { IReviewer, ReviewerTargetType } from "./reviewer.model";
import { CreateReviewerData, IReviewerRepository } from "./reviewer.repository";
import { ReviewerStatus } from "./reviewer.state-machine";

export interface PreparedReviewer {
    data: CreateReviewerData;
    projectDoc: IProject;
    contextName: string;
}

const OPEN_STATUSES = [
    ReviewerStatus.pending,
    ReviewerStatus.verified,
    ReviewerStatus.submitted,
];
export class ReviewerPolicy {

    constructor(
        private readonly repository: IReviewerRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly applicationRepo: IApplicationRepository,
        private readonly stageRepo: IStageRepository,
        private readonly userRepo: IUserRepository,
        private readonly collaboratorRepo: ICollaboratorRepository,
        private readonly verificationConfRepo: IVerificationConfigurationRepository,
        private readonly verificationRepo: IVerificationRepository,
        private readonly authPermissionService: AuthPermissionService,
        private readonly applicationService: ApplicationService
    ) { }

    async validateReviewer(projectId: string, reviewerId: string) {

        const reviewer = await this.userRepo.findById(reviewerId);
        if (!reviewer) {
            throw new AppError(
                ERROR_CODES.USER_NOT_FOUND
            );
        }

        const isCollaborator = await this.collaboratorRepo.exists({
            project: projectId, member: reviewerId
        });

        if (isCollaborator) {
            throw new AppError(
                ERROR_CODES.INVALID_REVIEWER,
                `Reviewer ${reviewer.name} is already a member in the project.`
            );
        }

        return reviewer;
    }

    async validateApplication(application: string) {
        const applicationDoc = await this.applicationRepo.findById(application);
        if (!applicationDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

        const projectDoc = await this.projectRepo.findById(
            String(applicationDoc.project)
        );
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const stageDoc = await this.stageRepo.findById(String(applicationDoc.stage));
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        return { applicationDoc: applicationDoc, projectDoc: projectDoc, stageDoc: stageDoc };
    }

    async prepareApplicationReviewer(applicationId: string, reviewerId: string, userId: string): Promise<PreparedReviewer> {
        const { applicationDoc, stageDoc, projectDoc } = await this.validateApplication(applicationId);
        const isAdmin =
            await this.authPermissionService.hasPermission(
                userId,
                "reviewer:create"
            );

        const isReviewerAssigner =
            applicationDoc.reviewerAssigner &&
            String(applicationDoc.reviewerAssigner) === String(userId);

        if (!isAdmin && !isReviewerAssigner) {
            throw new AppError(
                ERROR_CODES.UNAUTHORIZED
            );
        }

        if (applicationDoc.status !== ApplicationStatus.shortlisted)
            throw new AppError(ERROR_CODES.INVALID_APPLICATION_STATUS, "Application is not shortlisted");

        const countReviewers = await this.repository.count({ application: applicationId });
        const maxReviewers = stageDoc.maxReviewers;
        if (maxReviewers !== undefined && countReviewers >= maxReviewers) {
            throw new AppError(ERROR_CODES.REVIEWER_LIMIT_REACHED, `Reviewer limit reached. Maximum allowed is ${maxReviewers}.`);
        }

        const reviewerDoc = await this.validateReviewer(String(applicationDoc.project), reviewerId);

        const isExist = await this.repository.exists({
            application: applicationId,
            reviewer: reviewerId
        });

        if (isExist) {
            throw new AppError(
                ERROR_CODES.REVIEWER_ALREADY_EXISTS,
                `Reviewer ${reviewerDoc.name} is already assigned to this application.`
            );
        }

        if (!stageDoc.evaluation) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }

        return {
            data: {
                reviewer: reviewerId,
                project: String(applicationDoc.project),
                targetType: ReviewerTargetType.APPLICATION,
                application: applicationId,
                evaluation: String(stageDoc.evaluation),
                weight: 1,
                createdBy: userId
            },
            projectDoc: projectDoc,
            contextName: stageDoc.name,
        }

    }


    async validateVerification(verificationId: string) {
        const verificationDoc = await this.verificationRepo.findById(verificationId);
        if (!verificationDoc) throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);

        const projectDoc = await this.projectRepo.findById(
            String(verificationDoc.project)
        );
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const verificationConf = await this.verificationConfRepo.findById(String(verificationDoc.configuration));
        if (!verificationConf) throw new AppError(ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND);


        return {
            verificationDoc: verificationDoc, projectDoc: projectDoc,
            verificationConf: verificationConf
        };
    }

    async prepareVerificationReviewer(verificationId: string, reviewerId: string, userId: string): Promise<PreparedReviewer> {
        const { verificationDoc, projectDoc, verificationConf } = await this.validateVerification(verificationId);

        if (verificationDoc.status !== VerificationStatus.submitted)
            throw new AppError(ERROR_CODES.INVALID_VERIFICATION_STATUS);

        const countReviewers = await this.repository.count({ verification: verificationId });

        const maxReviewers = verificationConf.maxReviewers;
        if (maxReviewers !== undefined && countReviewers >= maxReviewers) {
            throw new AppError(ERROR_CODES.REVIEWER_LIMIT_REACHED, `Reviewer limit reached. Maximum allowed is ${maxReviewers}.`);
        }

        const reviewerDoc = await this.validateReviewer(String(verificationDoc.project), reviewerId);

        const isExist = await this.repository.exists({
            verification: verificationId,
            reviewer: reviewerId
        });

        if (isExist) {
            throw new AppError(
                ERROR_CODES.REVIEWER_ALREADY_EXISTS,
                `Reviewer ${reviewerDoc.name} is already assigned to this verification.`
            );
        }

        if (!verificationConf.evaluation) {
            throw new AppError(ERROR_CODES.EVALUATION_NOT_FOUND);
        }

        return {
            data: {
                reviewer: reviewerId,
                project: String(verificationDoc.project),
                targetType: ReviewerTargetType.VERIFICATION,
                verification: verificationId,
                evaluation: String(verificationConf.evaluation),
                weight: 1,
                createdBy: userId
            },
            projectDoc: projectDoc,
            contextName: "Verification"
        }
    }




    public async calculateApplicationScore(
        applicationId: string,
        userId: string,
        opts: { finalize?: boolean } = {}
    ) {
        const applicationDoc = await this.applicationRepo.findById(applicationId);
        if (!applicationDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

        const stageDoc = await this.stageRepo.findById(String(applicationDoc.stage));
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const minReviewers = stageDoc.minReviewers ?? 0;

        const all = await this.repository.find({ application: applicationId });
        const accepted = all.filter(r => r.status === ReviewerStatus.accepted);
        const stillOpen = all.filter(r => OPEN_STATUSES.includes(r.status)).length;

        const totalScore = this.calculateWeightedScore(accepted, minReviewers); // may be null

        const isDecided =
            applicationDoc.status === ApplicationStatus.accepted ||
            applicationDoc.status === ApplicationStatus.rejected;

        // 1. Decided, but a review is open again -> roll back to shortlisted
        if (isDecided) {
            if (stillOpen === 0) return applicationDoc;

            await this.applicationService.transitionState(
                { id: applicationId, current: applicationDoc.status, next: ApplicationStatus.shortlisted },
                userId
            );

            // score is provisional again (null if below minReviewers)
            return await this.applicationRepo.update(applicationId, { totalScore });
        }

        // 2. Not enough accepted reviews yet: no score, no decision
        if (totalScore === null) return applicationDoc;

        // 3. Provisional score
        const updated = await this.applicationRepo.update(applicationId, { totalScore });

        const roundClosed = stillOpen === 0 || opts.finalize === true;

        if (!roundClosed || applicationDoc.status !== ApplicationStatus.shortlisted) {
            return updated;
        }

        // 4. Decide
        const next = totalScore >= (stageDoc.minAcceptanceScore ?? 0)
            ? ApplicationStatus.accepted
            : ApplicationStatus.rejected;

        return await this.applicationService.transitionState(
            { id: applicationId, current: applicationDoc.status, next },
            userId
        );
    }


    public async calculateVerificationScore(
        verificationId: string
    ): Promise<number | null> {

        const verificationDoc =
            await this.verificationRepo.findById(verificationId);

        if (!verificationDoc) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_NOT_FOUND
            );
        }

        const configuration =
            await this.verificationConfRepo.findById(
                String(verificationDoc.configuration)
            );

        if (!configuration) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }

        const reviewers = await this.repository.find({
            verification: verificationId,
            status: ReviewerStatus.accepted
        });

        const verificationScore = this.calculateWeightedScore(
            reviewers,
            configuration.minReviewers ?? 0
        );

        return verificationScore;
    }

    private calculateWeightedScore(
        reviewers: IReviewer[], minReviewers: number
    ): number | null {

        if (
            reviewers.length === 0 ||
            reviewers.length < minReviewers
        ) {

            return null;
        }

        const totalWeight = reviewers.reduce(
            (sum, reviewer) =>
                sum + (reviewer.weight ?? 1),
            0
        );

        if (totalWeight === 0)
            return null;

        return reviewers.reduce(
            (sum, reviewer) =>
                sum +
                (reviewer.score ?? 0) *
                (reviewer.weight ?? 1),
            0
        ) / totalWeight;
    }
}