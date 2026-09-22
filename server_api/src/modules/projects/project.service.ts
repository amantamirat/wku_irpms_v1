import { PERMISSIONS } from "../../common/constants/permissions";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { AuthPermissionService } from "../auth/auth.permission-service";
import { AuthScope } from "../auth/auth.types";
import ScopeFilterService from "../auth/scope-filter.service";
import { CallStatus } from "../calls/call.model";
import { ICallRepository } from "../calls/call.repository";
import { IStageRepository } from "../calls/stages/stage.repository";
import { CompositionValidationService } from "../compositions/composition-validator.service";
import { ConstraintValidationService } from "../constraints/services/constraint-validator.service";
import { GrantStatus } from "../grants/grant.model";
import { IGrantRepository } from "../grants/grant.repository";
import { VerificationStatus } from "../grants/verifications/verification.model";
import { IVerificationRepository } from "../grants/verifications/verification.repository";
import { NotificationService } from "../notifications/notification.service";
import { TemplateValidationService } from "../templates/services/template-validation.service";
import { IUserRepository } from "../users/user.repository";
import { ApplicationStatus } from "./applications/application.model";
import { ApplicationService } from "./applications/application.service";
import { CollaboratorStatus } from "./collaborators/collaborator.model";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { PhaseStatus } from "./phase/phase.model";
import { IPhaseRepository } from "./phase/phase.repository";
import { PhaseService } from "./phase/phase.service";
import { ProjectAuth } from "./project.auth";
import {
    CreateProjectDTO,
    FilterProjectsDTO,
    UpdateProjectDTO,
} from "./project.dto";
import { ProjectStatus } from "./project.model";
import { IProjectRepository } from "./project.repository";
import { PROJECT_TRANSITIONS } from "./project.state-machine";


export class ProjectService {

    constructor(
        private readonly projectRepo: IProjectRepository,

        private readonly userRepo: IUserRepository,
        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly verificationRepo: IVerificationRepository,

        private readonly grantRepo: IGrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,

        private readonly collabService: CollaboratorService,
        private readonly phaseService: PhaseService,
        private readonly applicationService: ApplicationService,

        private readonly constraintValidator: ConstraintValidationService,
        private readonly compositionValidator: CompositionValidationService,
        private readonly templateValidator: TemplateValidationService,

        private readonly projectAuth: ProjectAuth,
        private readonly authPermissionService: AuthPermissionService,
        private readonly notificationService: NotificationService,
        private readonly scopeFilterService: ScopeFilterService,
    ) { }

    async create(
        dto: CreateProjectDTO,
        userId: string,
        options?: { skipValidation?: boolean }
    ) {
        const {
            grant,
            title,
            leadPI,
            collaborators,
            phases
        } = dto;

        const isLeadPI = leadPI === userId;

        if (!options?.skipValidation) {
            const isAdmin =
                await this.authPermissionService.hasPermission(
                    userId,
                    PERMISSIONS.PROJECT.CREATE
                );

            if (!isAdmin && !isLeadPI) {
                throw new AppError(ERROR_CODES.UNAUTHORIZED);
            }
        }

        // Lead PI is required because project.workspace
        // is derived from the lead PI's workspace.
        const leadDoc = await this.userRepo.findById(leadPI);

        if (!leadDoc) {
            throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        }

        if (!leadDoc.workspace) {
            throw new AppError(
                ERROR_CODES.WORKSPACE_NOT_FOUND,
                "The lead PI does not have a workspace."
            );
        }

        // Grant is required because project.organization
        // is derived from the grant's organization.
        const grantDoc = await this.grantRepo.findById(grant);

        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        if (!grantDoc.organization) {
            throw new AppError(
                ERROR_CODES.ORGANIZATION_NOT_FOUND,
                "The grant does not have an organization."
            );
        }

        if (!options?.skipValidation) {
            if (grantDoc.status !== GrantStatus.active) {
                throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);
            }
        }

        // Prevent duplicate project titles.
        if (await this.projectRepo.exists({ title })) {
            throw new AppError(
                ERROR_CODES.PROJECT_ALREADY_EXISTS,
                "A project with this title already exists. Please choose a different title."
            );
        }

        // Derive authorization/scope anchors server-side.
        const created = await this.projectRepo.create(
            {
                ...dto,
                workspace: String(leadDoc.workspace),
                organization: String(grantDoc.organization)
            },
            userId
        );

        if (!created) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const projectId = String(created._id);

        // --------------------------------------------------
        // Collaborators
        // --------------------------------------------------

        const projectCollaborators = [...(collaborators || [])];

        // Make sure the Lead PI is also a collaborator.
        const leadExists = projectCollaborators.some(
            collab => collab.member === leadPI
        );

        if (!leadExists) {
            projectCollaborators.unshift({
                member: leadPI,
                isLeadPI: true,
                role: "Principal Investigator"
            });
        }

        for (const collab of projectCollaborators) {
            const collaboratorIsLeadPI =
                leadPI === collab.member;

            await this.collabService.create(
                {
                    project: projectId,
                    projectTitle: title,
                    member: collab.member,
                    isLeadPI: collaboratorIsLeadPI,
                    status:
                        userId === collab.member
                            ? CollaboratorStatus.verified
                            : CollaboratorStatus.pending,
                    role: collaboratorIsLeadPI
                        ? "Principal Investigator"
                        : collab.role,
                    userId
                },
                options
            );
        }

        // --------------------------------------------------
        // Phases
        // --------------------------------------------------

        if (phases?.length) {
            const orderedPhases = [...phases].sort(
                (a, b) => a.order - b.order
            );

            for (const phase of orderedPhases) {
                await this.phaseService.create(
                    {
                        project: projectId,
                        order: phase.order,
                        title: phase.title,
                        budget: phase.budget,
                        duration: phase.duration,
                        description: phase.description,
                        userId
                    },
                    options
                );
            }
        }

        // Return the fully populated project.
        const projectDoc = await this.projectRepo.findById(
            projectId,
            { populate: true }
        );

        return projectDoc ?? created;
    }

    async apply(dto: CreateProjectDTO, userId: string) {
        const {
            call,
            leadPI,
            docPath
        } = dto;

        if (!call)
            throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

        if (!docPath)
            throw new AppError(ERROR_CODES.FILE_NOT_FOUND);

        const isLeadPI = leadPI === userId;

        if (!isLeadPI) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }
        //
        const leadUser = await this.userRepo.findById(leadPI);

        if (!leadUser) {
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);
        }

        const memberIds = dto.collaborators.map(
            collaborator => collaborator.member
        );

        const memberUsers = await this.userRepo.find({
            ids: memberIds
        });

        if (memberUsers.length !== memberIds.length) {
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);
        }
        //
        const callDoc = await this.callRepo.findById(call);

        if (!callDoc)
            throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

        if (callDoc.status !== CallStatus.active)
            throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

        // Get first stage
        const firstStageDoc = await this.stageRepo.getFirstStage(call);

        if (!firstStageDoc) {
            throw new AppError(
                ERROR_CODES.FIRST_STAGE_NOT_FOUND
            );
        }

        if (new Date(firstStageDoc.deadline) < new Date()) {
            throw new AppError(
                ERROR_CODES.STAGE_DEADLINE_PASSED
            );
        }

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

        if (callDoc.composition) {
            const result =
                await this.compositionValidator.validate(
                    String(callDoc.composition),
                    callDoc,
                    {
                        lead: leadUser,
                        members: memberUsers
                    }
                );

            if (!result.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_COMPOSITION,
                    "Composition validation failed",
                    400,
                    result
                );
            }
        }

        if (firstStageDoc.template) {
            const result =
                await this.templateValidator.validate(
                    String(firstStageDoc.template),
                    docPath
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
        const projectDoc =
            await this.create({
                ...dto,
                grant: String(callDoc.grant),
                calendar: String(callDoc.calendar)
            }, userId, { skipValidation: true });

        await this.applicationService.internalCreate({
            project: String(projectDoc._id),
            stage: String(firstStageDoc._id),
            documentPath: docPath,
        }, userId, projectDoc, firstStageDoc);

        return projectDoc;
    }

    async readProjects(
        filter: FilterProjectsDTO,
        userId: string,
        scope: AuthScope,
        options?: FilterOptions
    ) {
        const scopeFilter =
            this.scopeFilterService.getProjectFilter(scope);

        return this.projectRepo.find(
            filter,
            options, scopeFilter
        );
    }

    async lookup(filter: FilterProjectsDTO, options?: FilterOptions) {
        return this.projectRepo.find(filter, options);
    }

    getMyProjects = async (
        userId: string,
        filter?: FilterProjectsDTO,
        options?: FilterOptions
    ) => {
        return this.projectRepo.find({
            ...filter, leadPI: userId
        }, options);
    };

    async getById(id: string, options?: FilterOptions) {
        const proj = await this.projectRepo.findById(id, options);
        if (!proj) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        return proj;
    }

    // ---------------------------------------------------
    // UPDATE
    // ---------------------------------------------------
    async update(dto: UpdateProjectDTO, userId: string) {
        const { id, data } = dto;

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(id, userId, PERMISSIONS.PROJECT.UPDATE);

        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }
        }

        const nextThemes = data.themes ?? projectDoc.themes.map(String);
        const themesChanged =
            JSON.stringify(projectDoc.themes.map(String).sort()) !==
            JSON.stringify(nextThemes.map(String).sort());

        if (projectDoc.call && themesChanged) {
            const callDoc = await this.callRepo.findById(String(projectDoc.call));
            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

            if (callDoc.constraint) {
                const constraintId = String(callDoc.constraint);
                if (constraintId && this.constraintValidator) {
                    const result = await this.constraintValidator.validateThemes(constraintId, nextThemes);
                    if (!result.valid) {
                        throw new AppError(
                            ERROR_CODES.INVALID_CONSTRAINT,
                            "Theme validation failed",
                            400,
                            result
                        );
                    }
                }
            }
        }
        return this.projectRepo.update(id, data, userId);
    }


    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next } = dto;

        const projectDoc = await this.getById(id);

        const from = projectDoc.status as ProjectStatus;
        const to = next as ProjectStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(from, to, PROJECT_TRANSITIONS);

        if (to === ProjectStatus.approved) {

            const collabs = await this.collabRepo.find({ project: id });
            if (!collabs.every(c => c.status === CollaboratorStatus.verified))
                throw new AppError(ERROR_CODES.COLLABORATORS_NOT_FULLY_VERIFIED);

            const phases = await this.phaseRepo.find({ project: id });
            if (!phases.every(p => p.status === PhaseStatus.approved))
                throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_APPROVED);

            if (projectDoc.currentApplication) {
                if (!projectDoc.call) {
                    throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
                }

                const callDoc = await this.callRepo.findById(
                    String(projectDoc.call)
                );

                if (!callDoc) {
                    throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
                }

                const currentAppDoc = await this.applicationService.getById(
                    String(projectDoc.currentApplication)
                );

                const lastStage = await this.stageRepo.getLastStage(
                    String(callDoc._id)
                );

                if (!lastStage) {
                    throw new AppError(ERROR_CODES.LAST_STAGE_NOT_FOUND);
                }
                /**
                 * Project can only be approved from an accepted
                 * application that reached the final stage.
                 */
                if (currentAppDoc.status !== ApplicationStatus.accepted) {
                    throw new AppError(
                        ERROR_CODES.APPLICATION_NOT_ACCEPTED,
                        "The current application must be accepted before the project can be approved"
                    );
                }

                if (
                    String(currentAppDoc.stage) !==
                    String(lastStage._id)
                ) {
                    throw new AppError(
                        ERROR_CODES.APPLICATION_NOT_AT_FINAL_STAGE,
                        "The current application has not reached the final stage"
                    );
                }
            }
            /*
                   if (from !== ProjectStatus.granted && to === ProjectStatus.approved) {
                       await this.notificationService.notifyProjectFinalization(
                           String(projectDoc.leadPI), projectDoc.title
                       );
                   }*/

            const grandDoc = await this.grantRepo.findById(
                String(projectDoc.grant)
            );

            if (!grandDoc) {
                throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
            }
            if (grandDoc.constraint) {
                /*
                this.constraintValidator.validateProject(String(grandDoc.constraint),
                    projectDoc
                );*/
            }


        }


        if (to === ProjectStatus.refused) {
            await this.notificationService.notifyProjectRefusal(
                String(projectDoc.leadPI), projectDoc.title
            );
        }

        //rollback notification remain

        if (to === ProjectStatus.granted) {
            if (projectDoc.currentVerification) {
                const verificationDoc = await this.verificationRepo.findById(
                    String(projectDoc.currentVerification)
                );
                if (!verificationDoc) {
                    throw new AppError(ERROR_CODES.CURRENT_VERIFICATION_NOT_FOUND);
                }
                if (verificationDoc.status === VerificationStatus.submitted) {
                    throw new AppError(ERROR_CODES.CURRENT_VERIFICATION_SUBMITTED);
                }
                if (verificationDoc.status === VerificationStatus.verified) {
                    throw new AppError(ERROR_CODES.VERIFICATION_ALREADY_VERIFIED);
                }

            }
        }

        if (to === ProjectStatus.completed) {
            const phases = await this.phaseRepo.find({ project: id });
            if (!phases.every(p => p.status === PhaseStatus.completed))
                throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_COMPLETED);
        }

        return await this.projectRepo.updateStatus(id, to, userId);
    }


    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------
    async delete(dto: DeleteDto, userId: string) {
        const { id } = dto;
        const { projectDoc } = await this.projectAuth.auth(id, userId, PERMISSIONS.PROJECT.DELETE);
        if (
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT,
                "The project must be in draft or submitted status to perform this operation."
            );
        }
        if (projectDoc.currentApplication) {
            throw new AppError(ERROR_CODES.APPLICATION_ALREADY_EXISTS);
        }
        await this.collabRepo.deleteByProject(id);
        await this.phaseRepo.deleteByProject(id);
        return this.projectRepo.delete(id);
    }
}
