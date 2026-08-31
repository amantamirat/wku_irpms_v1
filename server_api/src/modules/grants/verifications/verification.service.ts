import { DeleteDto } from "../../../common/dtos/delete.dto";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { NotificationService } from "../../notifications/notification.service";
import { ProjectStatus } from "../../projects/project.model";
import { IProjectRepository } from "../../projects/project.repository";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ReviewerStatus } from "../../reviewers/reviewer.state-machine";
import { VerificationConfigurationStatus } from "../verification-conf/verification-conf.model";
import { IVerificationConfigurationRepository } from "../verification-conf/verification-conf.repository";
import { CreateVerificationDTO } from "./verification.dto";
import { IVerification, VerificationStatus } from "./verification.model";
import { FilterVerification, IVerificationRepository } from "./verification.repository";


export class VerificationService {

    constructor(
        private readonly repository: IVerificationRepository,
        private readonly verificationConfRepo: IVerificationConfigurationRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly notificationService?: NotificationService,
    ) { }
    // --------------------------------------------------
    // CREATE VERIFICATION
    // --------------------------------------------------
    async create(
        dto: CreateVerificationDTO,
        documentPath: string,
        submittedBy: string
    ): Promise<IVerification> {
        // ----------------------------------------------
        // 1. Find project
        // ----------------------------------------------
        const project =
            await this.projectRepo.findById(
                dto.project
            );

        if (!project) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }
        // ----------------------------------------------
        // 2. Project must be completed
        // ----------------------------------------------
        if (
            project.status !==
            ProjectStatus.completed
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_COMPLETED
            );
        }
        // ----------------------------------------------
        // 3. Get verification configuration
        // ----------------------------------------------
        const configuration =
            await this.verificationConfRepo.findByGrant(
                String(project.grant)
            );

        if (!configuration) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }
        // ----------------------------------------------
        // 4. Configuration must be active
        // ----------------------------------------------
        if (
            configuration.status !==
            VerificationConfigurationStatus.active
        ) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_INACTIVE
            );
        }
        // ----------------------------------------------
        // 5. Check deadline
        // ----------------------------------------------
        const now = new Date();
        if (
            now >
            new Date(configuration.deadline)
        ) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_DEADLINE_EXPIRED
            );
        }
        // ----------------------------------------------
        // 6. Check current verification
        // ----------------------------------------------
        let attempt = 1;

        if (project.currentVerification) {

            const currentVerification =
                await this.repository.findById(
                    String(project.currentVerification)
                );

            if (!currentVerification) {
                throw new AppError(
                    ERROR_CODES.VERIFICATION_NOT_FOUND
                );
            }
            // ------------------------------------------
            // Current verification is still active
            // ------------------------------------------
            if (
                currentVerification.status ===
                VerificationStatus.submitted
            ) {
                throw new AppError(
                    ERROR_CODES.VERIFICATION_ALREADY_EXISTS
                );
            }
            // ------------------------------------------
            // Already successfully verified
            // ------------------------------------------
            if (
                currentVerification.status ===
                VerificationStatus.verified
            ) {
                throw new AppError(
                    ERROR_CODES.VERIFICATION_ALREADY_VERIFIED
                );
            }
            // ------------------------------------------
            // Previous attempt failed
            // ------------------------------------------
            if (
                currentVerification.status ===
                VerificationStatus.rejected
            ) {
                attempt =
                    currentVerification.attempt + 1;
            }
        }
        // ----------------------------------------------
        // 7. Check maximum attempts
        // ----------------------------------------------
        if (
            attempt >
            configuration.maxAttempts
        ) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_MAX_ATTEMPTS_REACHED,
                "Maximum verification attempts reached. No further submissions are allowed."
            );
        }
        // ----------------------------------------------
        // 8. Create verification
        // ----------------------------------------------
        const verification =
            await this.repository.create({
                project: String(project._id),
                configuration: configuration._id,
                attempt,
                status: VerificationStatus.submitted,
                documentPath
            });
        // ----------------------------------------------
        // 9. Set as current verification
        // ----------------------------------------------
        await this.projectRepo.updateCurrentVerification(
            String(project._id),
            String(verification._id)
        );
        // ----------------------------------------------
        // 10. Send notification
        // ----------------------------------------------
        if (this.notificationService) {
            await this.notificationService
                .notifyVerificationSubmitted(
                    String(project.leadPI),
                    project.title
                );
        }

        return verification;
    }


    // --------------------------------------------------
    // GET BY ID
    // --------------------------------------------------

    async getById(
        id: string
    ): Promise<IVerification> {

        const verification =
            await this.repository.findById(id);

        if (!verification) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_NOT_FOUND
            );
        }

        return verification;
    }


    /*
    // --------------------------------------------------
    // GET BY CONF
    // --------------------------------------------------
    async getByConfiguration(
        confId: string
    ): Promise<IVerification[]> {
        // Make sure conf exists
        const conf =
            await this.verificationConfRepo.findById(
                confId
            );
        if (!conf) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
            );
        }
        return await this.repository.find({ configuration: confId }, { populate: true });
    }

    // --------------------------------------------------
    // GET BY PROJECT
    // --------------------------------------------------
    async getByProject(
        projectId: string
    ): Promise<IVerification[]> {
        // Make sure project exists
        const proj =
            await this.projectRepo.findById(
                projectId
            );
        if (!proj) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }
        return await this.repository.find({ project: projectId });
    }
    */

    async find(
        filters: FilterVerification = {},
        options?: FilterOptions
    ): Promise<IVerification[]> {

        return await this.repository.find(
            filters, options
        );
    }

    private async calculateTotalScore(id: string): Promise<number> {
        const approvedReviews =
            await this.reviewerRepo.find({
                verification: id,
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
 * Transition verification status (state machine)
 */
    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next, userId } = dto;
        if (!userId) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        const verificationDoc = await this.repository.findById(id);

        if (!verificationDoc) {
            throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);
        }

        const projectId = String(verificationDoc.project);

        const projectDoc = await this.projectRepo.findById(projectId);

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }

        if (!projectDoc.currentVerification) {
            throw new AppError(
                ERROR_CODES.CURRENT_VERIFICATION_NOT_FOUND
            );
        }

        if (String(projectDoc.currentVerification) !== id) {
            throw new AppError(
                ERROR_CODES.INVALID_VERIFICATION_STATUS
            );
        }

        if (projectDoc.status !== ProjectStatus.completed) {
            throw new AppError(
                ERROR_CODES.INVALID_PROJECT_STATUS
            );
        }

        const from = verificationDoc.status as VerificationStatus;
        const to = next as VerificationStatus;

        // Prevent race condition
        if (current && current !== from) {
            throw new AppError(
                ERROR_CODES.STATE_OUT_OF_SYNC
            );
        }

        // Validate state transition
        TransitionHelper.validateTransition(
            from,
            to,
            VERIFICATION_TRANSITIONS
        );

        // Verification can only be completed after enough approved reviews
        if (
            to === VerificationStatus.verified ||
            to === VerificationStatus.rejected
        ) {
            const configuration =
                await this.verificationConfRepo.findById(
                    String(verificationDoc.configuration)
                );

            if (!configuration) {
                throw new AppError(
                    ERROR_CODES.VERIFICATION_CONFIGURATION_NOT_FOUND
                );
            }

            const approvedCount =
                await this.reviewerRepo.count({
                    verification: id,
                    status: ReviewerStatus.approved
                });

            if (approvedCount < configuration.minReviewers) {
                throw new AppError(
                    ERROR_CODES.INSUFFICIENT_REVIEWS,
                    `At least ${configuration.minReviewers} approved reviews are required.`
                );
            }

            const totalScore =
                await this.calculateTotalScore(id);

            if (to === VerificationStatus.verified) {
                const minAcceptanceScore =
                    configuration.minAcceptanceScore ?? 0;

                if ((totalScore ?? 0) < minAcceptanceScore) {
                    throw new AppError(
                        ERROR_CODES.SCORE_BELOW_THRESHOLD,
                        `Cannot verify. Minimum required score is ${minAcceptanceScore}, but got ${totalScore}.`
                    );
                }
            }
        }

        return this.repository.updateStatus(id, to, userId);
    }

    /**
 * Delete Verification
 */
    async delete(
        dto: DeleteDto
    ) {
        const { id } = dto;

        const verificationDoc =
            await this.repository.findById(id);

        if (!verificationDoc) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_NOT_FOUND
            );
        }

        if (
            verificationDoc.status !==
            VerificationStatus.submitted
        ) {
            throw new AppError(
                ERROR_CODES.VERIFICATION_NOT_SUBMITTED
            );
        }

        const projectId =
            String(verificationDoc.project);

        const projectDoc =
            await this.projectRepo.findById(projectId);

        if (!projectDoc) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_FOUND
            );
        }

        if (!projectDoc.currentVerification) {
            throw new AppError(
                ERROR_CODES.CURRENT_VERIFICATION_NOT_FOUND
            );
        }

        if (
            String(projectDoc.currentVerification) !==
            String(id)
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_VERIFICATION,
                "This verification is not the current verification for the project."
            );
        }


        if (
            await this.reviewerRepo.exists({
                verification: id
            })
        ) {
            throw new AppError(
                ERROR_CODES.REVIEWER_ALREADY_EXISTS
            );
        }

        // ----------------------------------------------
        // Determine the new current verification
        // ----------------------------------------------

        if (verificationDoc.attempt === 1) {
            await this.projectRepo.clearCurrentVerification(projectId);
        } else {
            // ----------------------------------------------
            // Update project current verification
            // ----------------------------------------------
            const previousVerification =
                await this.repository.findOneByAttempt(
                    projectId,
                    verificationDoc.attempt - 1
                );
            await this.projectRepo.updateCurrentVerification(projectId,
                previousVerification ? String(previousVerification._id) : null
            );
        }
        // ----------------------------------------------
        // Delete verification
        // ----------------------------------------------
        return this.repository.delete(id);
    }

}

export const VERIFICATION_TRANSITIONS: Record<
    VerificationStatus,
    VerificationStatus[]
> = {
    [VerificationStatus.submitted]: [
        VerificationStatus.verified,
        VerificationStatus.rejected
    ],

    [VerificationStatus.verified]: [
        VerificationStatus.submitted
    ],

    [VerificationStatus.rejected]: [
        VerificationStatus.submitted
    ]
};