import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { IStageRepository } from "../calls/stages/stage.repository";
import { IVerificationConfigurationRepository } from "../grants/verification-conf/verification-conf.repository";
import { VerificationStatus } from "../grants/verifications/verification.model";
import { IVerificationRepository } from "../grants/verifications/verification.repository";
import { ApplicationStatus } from "../projects/applications/application.model";
import { IApplicationRepository } from "../projects/applications/application.repository";
import { ICollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { IProject } from "../projects/project.model";
import { IProjectRepository } from "../projects/project.repository";
import { IUserRepository } from "../users/user.repository";
import { ReviewerTargetType } from "./reviewer.model";
import { CreateReviewerData, IReviewerRepository } from "./reviewer.repository";

export interface PreparedReviewer {
    data: CreateReviewerData;
    project: IProject;
    contextName: string;
}
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
                `Reviewer ${reviewer.name} is already a collaborator in the project.`
            );
        }

        return reviewer;
    }

    async validateApplication(application: string) {
        const projectAppDoc = await this.applicationRepo.findById(application);
        if (!projectAppDoc) throw new AppError(ERROR_CODES.APPLICATION_NOT_FOUND);

        if (projectAppDoc.status !== ApplicationStatus.pending)
            throw new AppError(ERROR_CODES.INVALID_APPLICATION_STATUS);
        return projectAppDoc;
    }

    async prepareApplicationReviewer(applicationId: string, reviewerId: string): Promise<PreparedReviewer> {
        const applicationDoc = await this.validateApplication(applicationId);

        const projectDoc = await this.projectRepo.findById(
            String(applicationDoc.project)
        );
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        // All collaborators must be verified before assigning reviewers
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

        const stageDoc = await this.stageRepo.findById(String(applicationDoc.stage));
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

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
                evaluation: String(stageDoc.evaluation)
            },
            project: projectDoc,
            contextName: stageDoc.name
        }

    }


    async validateVerification(verificationId: string) {
        const verificationDoc = await this.verificationRepo.findById(verificationId);
        if (!verificationDoc) throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);

        if (verificationDoc.status !== VerificationStatus.submitted)
            throw new AppError(ERROR_CODES.INVALID_VERIFICATION_STATUS);

        return verificationDoc;
    }

    async prepareVerificationReviewer(verificationId: string, reviewerId: string): Promise<PreparedReviewer> {
        const verificationDoc = await this.validateVerification(verificationId);

        const projectDoc = await this.projectRepo.findById(
            String(verificationDoc.project)
        );
        if (!projectDoc) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }
        const verificationConf = await this.verificationConfRepo.findById(String(verificationDoc.configuration));
        if (!verificationConf) throw new AppError(ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND);
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
            },
            project: projectDoc,
            contextName: "Verification"
        }
    }
}