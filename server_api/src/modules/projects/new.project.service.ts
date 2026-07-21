import mongoose from "mongoose";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ICallRepository } from "../calls/call.repository";
import { ICallStageRepository } from "../calls/stages/call.stage.repository";
import { IGrantAllocationRepository } from "../grants/allocations/grant.allocation.repository";
import { CompositionValidator } from "../grants/compositions/composition.validator";
import { ConstraintValidator } from "../grants/constraints/constraint.validator";
import { GrantStatus } from "../grants/grant.model";
import { IGrantRepository, GrantRepository } from "../grants/grant.repository";
import { IGrantStageRepository, GrantStageRepository } from "../grants/stages/grant.stage.repository";
import { NotificationService } from "../notifications/notification.service";
import { IProjectApplicationRepository } from "./applications/project.application.repository";
import { ProjectApplicationService } from "./applications/project.application.service";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { IPhaseRepository } from "./phase/phase.repository";
import { PhaseService } from "./phase/phase.service";
import { ProjectAuth } from "./project.auth";
import { CreateGrantProjectDTO } from "./project.dto";
import { IProjectRepository } from "./project.repository";

export class NewProjectService {
    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly collabService: CollaboratorService,
        private readonly phaseService: PhaseService,
        private readonly constValidator = new ConstraintValidator(),
        private readonly compValidator = new CompositionValidator(),
        private readonly grantRepo: IGrantRepository = new GrantRepository(),

    ) { }
    async createFromGrant(dto: CreateGrantProjectDTO) {

        const {
            grant,
            title,
            summary,
            applicant,
            themes,
            collaborators,
            phases
        } = dto;


        // 1. Validate Lead PI
        const leadPI =
            collaborators.filter(c => c.isLeadPI);


        if (leadPI.length !== 1) {
            throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        }

        const lead = leadPI[0];


        if (lead.applicant !== applicant) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }



        // 2. Validate Grant
        const grantDoc =
            await this.grantRepo.findById(grant);


        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }


        if (grantDoc.status !== GrantStatus.active) {
            throw new AppError(
                ERROR_CODES.GRANT_NOT_ACTIVE
            );
        }



        // 3. Validate duplicated collaborators
        const uniqueApplicants =
            new Set(
                collaborators.map(
                    c => c.applicant
                )
            );


        if (
            uniqueApplicants.size !== collaborators.length
        ) {
            // throw new AppError(ERROR_CODES.DUPLICATE_COLLABORATOR);
            throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
        }



        // 4. Business validations
        await this.constValidator.validateAll(
            grant,
            {
                participantCount: collaborators.length,
                phases,
                themes,
                title,
                summary
            }
        );


        await this.compValidator.validateAll(
            grant,
            collaborators
        );



        const skipValidation = {
            skipValidation: true
        };


        const session =
            await mongoose.startSession();


        try {

            let createdProject;


            await session.withTransaction(
                async () => {


                    // Create project
                    createdProject =
                        await this.projectRepo.create(
                            {
                                grant,
                                title,
                                summary,
                                applicant,
                                themes
                            },
                            session
                        );


                    const projectId =
                        String(createdProject._id);



                    // Create collaborators
                    for (const collab of collaborators) {


                        await this.collabService.create(
                            {
                                project: projectId,

                                projectTitle: title,

                                applicant:
                                    collab.applicant,

                                role:
                                    collab.isLeadPI
                                        ? "Principal Investigator"
                                        : collab.role,

                                // FIXED
                                userId:
                                    collab.applicant
                            },

                            skipValidation,

                            session
                        );
                    }



                    // Create phases
                    const orderedPhases =
                        [...phases]
                            .sort(
                                (a, b) =>
                                    a.order - b.order
                            );


                    for (const phase of orderedPhases) {

                        await this.phaseService.create(
                            {
                                project: projectId,

                                order: phase.order,

                                title: phase.title,

                                budget: phase.budget,

                                duration:
                                    phase.duration,

                                description:
                                    phase.description,

                                applicantId:
                                    applicant
                            },

                            skipValidation,

                            session
                        );
                    }

                }
            );


            return createdProject;


        } catch (error) {

            throw error;

        } finally {

            await session.endSession();

        }
    }
}