import { PERMISSIONS } from "../../common/constants/permissions";
import { SYSTEM } from "../../common/constants/system.constant";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { FileStorageService } from "../../common/services/file-storage.service";
import ScopeFilterService from "../../common/services/scope-filter.service";
import { ApplicationStatus } from "../applications/application.model";
import { ApplicationService, FAILED_STATES } from "../applications/application.service";
import { AuthPermissionService } from "../auth/auth.permission-service";
import { AuthScope } from "../auth/auth.types";
import { ICalendarRepository } from "../calendar/calendar.repository";
import { CallStatus } from "../calls/call.model";
import { ICallRepository } from "../calls/call.repository";
import { IStageRepository } from "../calls/stages/stage.repository";
import { CompositionValidationService } from "../compositions/composition-validation-service";
import { HistoryContextInput } from "../compositions/history/history-validation-service";
import { ConstraintValidationService } from "../constraints/services/constraint-validator.service";
import { GrantStatus } from "../grants/grant.model";
import { IGrantRepository } from "../grants/grant.repository";
import { VerificationStatus } from "../grants/verifications/verification.model";
import { IVerificationRepository } from "../grants/verifications/verification.repository";
import { NotificationService } from "../notifications/notification.service";
import { TemplateValidationService } from "../templates/services/template-validation.service";
import { IUserRepository } from "../users/user.repository";
import { PhaseActivityRepository } from "./activities/phase-activity.repository";
import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { CollaboratorStatus } from "./collaborators/collaborator.model";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { ProjectComponentRepository } from "./components/component.repository";
import { PhaseEquipmentRepository } from "./equipments/phase-equipment.repository";
import { PhaseDocumentType, ProjectDocumentStatus } from "./phase/documents/phase.doc.model";
import { PhaseDocumentRepository } from "./phase/documents/phase.doc.repository";
import { PhaseStatus } from "./phase/phase.model";
import { IPhaseRepository } from "./phase/phase.repository";
import { PhaseService } from "./phase/phase.service";
import { ProjectAuth } from "./project.auth";
import {
    ApplyProjectDTO,
    FilterProjectsDTO,
    InternalCreateProjectDto,
    UpdateProjectDTO,
} from "./project.dto";
import { ProjectStatus } from "./project.model";
import { IProjectRepository } from "./project.repository";
import { CreateProjectDto } from "./project.dto";
import { PROJECT_TRANSITIONS } from "./project.state-machine";
import { toObjectId } from "../../common/utils/mongoose.utils";
import { ApplicationRepository } from "../applications/application.repository";

const HALT_STATES: ProjectStatus[] = [
    ProjectStatus.refused,
    ProjectStatus.completed,
    ProjectStatus.verified,
    ProjectStatus.terminated
];

const EXECUTION_STATES: ProjectStatus[] = [
    ProjectStatus.approved,
    ProjectStatus.granted
];


export class ProjectService {

    constructor(
        private readonly projectRepo: IProjectRepository,


        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly componentRepo: ProjectComponentRepository,
        private readonly activityRepo: PhaseActivityRepository,
        private readonly equipmentRepo: PhaseEquipmentRepository,
        private readonly documentRepo: PhaseDocumentRepository,


        private readonly userRepo: IUserRepository,
        private readonly verificationRepo: IVerificationRepository,

        private readonly grantRepo: IGrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly calendarRepo: ICalendarRepository,
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
        private readonly fileStorage: FileStorageService
    ) { }

    async create(dto: CreateProjectDto, userId: string) {
        const {
            grant,
            calendar,
            call,
            title,
            summary,
            objectives,
            totalBudget,
            totalDuration,
            keywords = [],
            themes
        } = dto;

        // --- Basic validation ---
        if (totalBudget < 0 || totalDuration <= 0) {
            throw new AppError(
                ERROR_CODES.INVALID_INPUT,
                "Total budget must be non-negative and total duration must be greater than zero."
            );
        }

        // --- Grant ---
        const grantDoc = await this.grantRepo.findById(grant);

        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);

        if (grantDoc.status !== GrantStatus.active) {
            throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);
        }

        // --- Constraint validation ---
        if (grantDoc.constraint) {
            const constraintDoc = await this.constraintValidator.getConstraint(
                grantDoc.constraint.toString()
            );

            const validationResult =
                await this.constraintValidator.validateProjectContent(
                    constraintDoc,
                    { ...dto },
                );

            if (!validationResult.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_CONSTRAINT,
                    `The Project ${title} do not satisfy the constraint requirements.`,
                    400,
                    validationResult
                );
            }
        }

        // --- Call and Calendar ---
        let calendarId = calendar;

        if (call) {
            const callDoc = await this.callRepo.findById(call);

            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

            calendarId = String(callDoc.calendar);
        }

        const calendarDoc = await this.calendarRepo.findById(calendarId);

        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);

        // --- Creator's workspace ---
        const userDoc = await this.userRepo.findById(userId);

        // --- Duplicate title ---
        if (await this.projectRepo.exists({ title })) {
            throw new AppError(
                ERROR_CODES.PROJECT_ALREADY_EXISTS,
                "A project with this title already exists. Please choose a different title."
            );
        }

        // --- Create project ---
        const created = await this.projectRepo.create(
            {
                ...dto,
                calendar: calendarId,
                workspace: userDoc?.workspace
                    ? String(userDoc.workspace)
                    : undefined,
                organization: String(grantDoc.organization),
            },
            userId
        );

        if (!created) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        return created;
    }



    async apply(
        id: string,
        dto: ApplyProjectDTO,
        userId: string,
        file: Express.Multer.File
    ) {
        try {

            const callDoc = await this.callRepo.findById(id);
            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
            if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

            const firstStageDoc = await this.stageRepo.getFirstStage(id);
            if (!firstStageDoc) throw new AppError(ERROR_CODES.FIRST_STAGE_NOT_FOUND);

            if (new Date(firstStageDoc.deadline) < new Date()) {
                throw new AppError(ERROR_CODES.CALL_DEADLINE_PASSED);
            }

            if (dto.collaborators) {
                const memberIds = dto.collaborators.map(c => c.member);
                const memberUsers = await this.userRepo.find({ ids: memberIds });
                if (memberUsers.length !== memberIds.length) {
                    throw new AppError(ERROR_CODES.USER_NOT_FOUND);
                }
            }

            if (firstStageDoc.constraint) {
                const constantDoc = await this.constraintValidator.getConstraint(firstStageDoc.constraint.toString());
                const result =
                    await this.constraintValidator.validateProject
                        (constantDoc, dto);

                if (!result?.valid) {
                    throw new AppError(
                        ERROR_CODES.INVALID_CONSTRAINT,
                        "Stage Constraint validation failed",
                        400,
                        result
                    );
                }
            }


            if (firstStageDoc.template) {
                const result =
                    await this.templateValidator.validate(
                        String(firstStageDoc.template),
                        file.path
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

            if (await this.projectRepo.exists({ title: dto.title })) {
                throw new AppError(
                    ERROR_CODES.PROJECT_ALREADY_EXISTS,
                    "A project with this title already exists. Please choose a different title."
                );
            }

            // The project must exist first: the file path needs its id
            const projectDoc = await this.internalCreate(
                {
                    ...dto,
                    grant: String(callDoc.grant),
                    calendar: String(callDoc.calendar),
                    organization: String(callDoc.organization),
                    leadPI: userId
                },
                userId,
                { skipValidation: true }
            );

            try {
                await this.applicationService.internalCreate(
                    {
                        project: String(projectDoc._id),
                        stage: String(firstStageDoc._id),
                    },
                    userId,
                    projectDoc,
                    firstStageDoc,
                    file
                );
            } catch (err) {
                // Don't leave a project without its application
                await this.projectRepo.delete(String(projectDoc._id)); // adjust to your repo API
                throw err;
            }

            return projectDoc;
        } catch (error) {
            // No-op if internalCreate already moved or discarded the file
            await this.fileStorage.discardTemp(file.path);
            throw error;
        }
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
    async update(id: string, dto: UpdateProjectDTO, userId: string) {

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            id,
            userId,
            PERMISSIONS.PROJECT.UPDATE,
        );

        if (HALT_STATES.includes(projectDoc.status)) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        if (isLeadPI) {
            await this.projectAuth.validateOwner(projectDoc);
        }

        // Budget modification is currently not supported
        if (
            dto.totalBudget !== undefined &&
            dto.totalBudget !== projectDoc.totalBudget
        ) {
            throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        }

        return this.projectRepo.update(id, dto, userId);
    }

    //TRANSISITIONS

    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next, reason } = dto;

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

            if (projectDoc.call) {
                if (!projectDoc.currentApplication) {
                    throw new AppError(ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND);
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

            const grantDoc = await this.grantRepo.findById(
                String(projectDoc.grant)
            );

            if (!grantDoc) {
                throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
            }

            const context: HistoryContextInput = {
                organization: grantDoc.organization.toString(),
                source: grantDoc.fundingSource,
                calendar: projectDoc.calendar?.toString(),
                call: projectDoc.call?.toString()
            };

            if (grantDoc.constraint) {
                const constraintDoc = await this.constraintValidator.getConstraint(grantDoc.constraint.toString());
                const result = await this.constraintValidator.validateProjectById(constraintDoc, id);
                if (!result.valid) {
                    throw new AppError(
                        ERROR_CODES.INVALID_CONSTRAINT,
                        "Constraint validation failed",
                        400,
                        result
                    );
                }
            }

            if (grantDoc.composition) {
                const compositionDoc = await this.compositionValidator.getComposition(grantDoc.composition.toString());

                const result = await this.compositionValidator.validateByProjectId(compositionDoc, context, id);
                if (!result.valid) {
                    throw new AppError(
                        ERROR_CODES.INVALID_COMPOSITION,
                        "Composition validation failed",
                        400,
                        result
                    );
                }
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

            const hasCompletionReport = await this.documentRepo.exists({
                project: id,
                type: PhaseDocumentType.completionReport,
                status: ProjectDocumentStatus.approved
            });

            if (!hasCompletionReport) {
                throw new AppError(ERROR_CODES.COMPLETION_REPORT_REQUIRED);
            }

        }


        if (to === ProjectStatus.verified) {
            if (!projectDoc.currentVerification) {
                throw new AppError(ERROR_CODES.VERIFICATION_NOT_FOUND);
            }

            const verificationDoc = await this.verificationRepo.findById(
                String(projectDoc.currentVerification)
            );
            if (!verificationDoc) {
                throw new AppError(ERROR_CODES.CURRENT_VERIFICATION_NOT_FOUND);
            }

            if (verificationDoc.status !== VerificationStatus.verified) {
                throw new AppError(ERROR_CODES.VERIFICATION_NOT_VERIFIED);
            }

        }

        return await this.projectRepo.update(id, {
            status: to,
            statusHistory: {
                status: to,
                changedBy: toObjectId(userId),
                reason,
                changedAt: new Date(),
            },
        }, userId);

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

    /////////////OLD functions///////////////////////

    async internalCreate(
        dto: InternalCreateProjectDto,
        userId: string,
        options?: { skipValidation?: boolean },
    ) {
        const {
            title,
            leadPI,
            collaborators,
            phases,
            components,
            activities,
            equipments,
        } = dto;

        // --------------------------------------------------
        // Lead PI / Workspace
        // --------------------------------------------------

        let workspace: string | undefined;


        const leadDoc = await this.userRepo.findById(leadPI);

        if (!leadDoc) {
            throw new AppError(ERROR_CODES.LEAD_PI_NOT_FOUND);
        }

        if (!leadDoc.workspace) {
            throw new AppError(
                ERROR_CODES.WORKSPACE_NOT_FOUND,
                "The lead PI does not have a workspace.",
            );
        }

        workspace = String(leadDoc.workspace);


        // --------------------------------------------------
        // Prevent duplicate project titles
        // --------------------------------------------------

        if (await this.projectRepo.exists({ title })) {
            throw new AppError(
                ERROR_CODES.PROJECT_ALREADY_EXISTS,
                "A project with this title already exists. Please choose a different title.",
            );
        }

        // --------------------------------------------------
        // Create Project
        // --------------------------------------------------

        const created = await this.projectRepo.create(
            {
                ...dto,
                workspace
            },
            userId,
        );

        if (!created) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        }

        const projectId = String(created._id);

        // --------------------------------------------------
        // Collaborators
        // --------------------------------------------------

        const projectCollaborators = [...(collaborators ?? [])];

        if (leadPI) {
            const leadExists = projectCollaborators.some(
                collab => String(collab.member) === String(leadPI),
            );

            if (!leadExists) {
                projectCollaborators.unshift({
                    member: leadPI,
                    isLeadPI: true,
                    role: "Principal Investigator",
                } as CollaboratorDto);
            }
        }

        for (const collab of projectCollaborators) {
            const collaboratorIsLeadPI =
                !!leadPI && String(leadPI) === String(collab.member);

            await this.collabService.create(
                {
                    project: projectId,
                    //projectTitle: title,
                    member: collab.member,
                    // isLeadPI: collaboratorIsLeadPI,
                    /*
                     status:
                         collab.status ??
                         (
                             String(userId) === String(collab.member)
                                 ? CollaboratorStatus.verified
                                 : CollaboratorStatus.pending
                         ),
                         */
                    role: collaboratorIsLeadPI
                        ? "Principal Investigator"
                        : collab.role,
                },
                userId,
                { skipValidation: true },
            );
        }

        // --------------------------------------------------
        // Phases
        // --------------------------------------------------

        if (phases?.length) {
            for (const phase of phases) {
                await this.phaseService.create(
                    {
                        ...phase,
                        project: projectId,
                        status: phase.status ?? PhaseStatus.proposed,
                        userId,
                    },
                    SYSTEM.SU_USER,
                    options,
                );
            }
        }

        // --------------------------------------------------
        // Components
        // --------------------------------------------------

        if (components?.length) {
            for (const component of components) {
                await this.componentRepo.create(
                    {
                        ...component,
                        project: projectId,
                    },
                    //userId,
                );
            }
        }

        // --------------------------------------------------
        // Activities
        // --------------------------------------------------

        if (activities?.length) {
            for (const activity of activities) {
                await this.activityRepo.create(
                    {
                        ...activity,
                        project: projectId,
                    },
                    // userId,
                );
            }
        }

        // --------------------------------------------------
        // Equipments
        // --------------------------------------------------

        if (equipments?.length) {
            for (const equipment of equipments) {
                await this.equipmentRepo.create(
                    {
                        ...equipment,
                        project: projectId,
                    },
                    // userId,
                );
            }
        }

        return created;
    }





}
