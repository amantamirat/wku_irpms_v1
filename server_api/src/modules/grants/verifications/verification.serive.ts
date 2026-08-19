import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { ProjectStatus } from "../../projects/project.model";
import { IProjectRepository } from "../../projects/project.repository";
import { VerificationConfigurationStatus } from "../verification-conf/verification-conf.model";
import { IVerificationConfigurationRepository } from "../verification-conf/verification-conf.repository";
import { CreateVerificationDTO } from "./verification.dto";
import { IVerification, VerificationStatus } from "./verification.model";
import { IVerificationRepository } from "./verification.repository";


export class VerificationService {

    constructor(
        private readonly repository: IVerificationRepository,
        private readonly verificationConfRepo: IVerificationConfigurationRepository,
        private readonly projectRepo: IProjectRepository
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


            if (
                currentVerification.status ===
                VerificationStatus.under_review
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
                VerificationStatus.failed
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
                submittedBy,
                documentPath
                //submittedAt: now
            });


        // ----------------------------------------------
        // 9. Set as current verification
        // ----------------------------------------------

        await this.projectRepo.updateCurrentVerification(
            String(project._id),
            String(verification._id)
        );

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
        return this.repository.findByConfiguration(
            confId
        );
    }

}