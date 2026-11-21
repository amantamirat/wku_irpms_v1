import mongoose, { Types } from "mongoose";
import { PERMISSIONS } from "../../common/constants/permissions";
import { DeleteDto } from "../../common/dtos/delete.dto";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../common/dtos/transition.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { TransitionHelper } from "../../common/helpers/transition.helper";
import { FileStorageService } from "../../common/services/file-storage.service";
import ScopeFilterService from "../../common/services/scope-filter.service";
import { toObjectId } from "../../common/utils/mongoose.utils";
import { ApplicationStatus } from "../applications/application.model";
import { ApplicationRepository } from "../applications/application.repository";
import { ApplicationService } from "../applications/application.service";
import { AuthScope } from "../auth/auth.types";
import { ICalendarRepository } from "../calendar/calendar.repository";
import { CallStatus } from "../calls/call.model";
import { ICallRepository } from "../calls/call.repository";
import { StageStatus } from "../calls/stages/stage.model";
import { IStageRepository } from "../calls/stages/stage.repository";
import { CompositionValidationService, toCompositionValidationInput } from "../compositions/composition-validation-service";
import { HistoryContextInput } from "../compositions/history/history-validation-service";
import { ConstraintValidationService, ProjectInput } from "../constraints/ConstraintValidationService";
import { GrantStatus, IGrant } from "../grants/grant.model";
import { IGrantRepository } from "../grants/grant.repository";
import { VerificationStatus } from "../grants/verifications/verification.model";
import { IVerificationRepository } from "../grants/verifications/verification.repository";
import { NotificationService } from "../notifications/notification.service";
import { TemplateValidationService } from "../templates/services/template-validation.service";
import { IUserRepository } from "../users/user.repository";
import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { CollaboratorStatus, LeaderRole } from "./collaborators/collaborator.model";
import { ICollaboratorRepository } from "./collaborators/collaborator.repository";
import { CollaboratorService } from "./collaborators/collaborator.service";
import { ProjectComponentStatus } from "./components/component.model";
import { ProjectComponentRepository } from "./components/component.repository";
import { PhaseDocumentType, ProjectDocumentStatus } from "./phase/documents/phase.doc.model";
import { PhaseDocumentRepository } from "./phase/documents/phase.doc.repository";
import { IPhase, PhaseStatus } from "./phase/phase.model";
import { IPhaseRepository } from "./phase/phase.repository";
import { PhaseService } from "./phase/phase.service";
import { ProjectAuth } from "./project.auth";
import {
    ApplyProjectDto,
    CreateProjectDto,
    FilterProjectsDTO,
    UpdateProjectDTO
} from "./project.dto";
import { IProject, IProjectObjectives, ProjectStatus } from "./project.model";
import { IProjectRepository } from "./project.repository";
import { PROJECT_TRANSITIONS } from "./project.state-machine";
import { ProjectConsistencyValidator } from "./ProjectConsistencyValidator";

export const PROJECT_EDITABLE_STATES: ProjectStatus[] = [
    ProjectStatus.draft,
    ProjectStatus.granted
];

type ProjectMapperInput = {
    title?: string;
    summary?: string;
    keywords?: string[];
    totalBudget?: number;
    totalDuration?: number;
    themes?: (string | Types.ObjectId)[];
    objectives?: IProjectObjectives;
};

export const mapProjectToInput = (
    project: ProjectMapperInput
): ProjectInput => ({
    title: project.title ?? '',
    summary: project.summary ?? '',
    keywords: project.keywords ?? [],

    totalBudget: project.totalBudget ?? 0,
    totalDuration: project.totalDuration ?? 0,

    themes: project.themes?.map(String) ?? [],

    objectives: {
        general: project.objectives?.general ?? '',
        specific: project.objectives?.specific ?? [],
        expectedOutputs: project.objectives?.expectedOutputs ?? [],
    },
});

interface ValidateProjectParams {
    grantDoc: IGrant;
    projectId?: string;
    project: ProjectMapperInput;
    phases?: IPhase[];
    label: string;
}
const idOf = (v: any): string => (typeof v === 'string' ? v : (v._id ?? v).toString());


export class ProjectService {

    constructor(
        private readonly projectRepo: IProjectRepository,


        private readonly collabRepo: ICollaboratorRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly componentRepo: ProjectComponentRepository,
        private readonly documentRepo: PhaseDocumentRepository,

        private readonly userRepo: IUserRepository,
        private readonly verificationRepo: IVerificationRepository,

        private readonly calendarRepo: ICalendarRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly applicationRepo: ApplicationRepository,

        private readonly collabService: CollaboratorService,
        private readonly phaseService: PhaseService,
        private readonly applicationService: ApplicationService,

        private readonly constraintValidationService: ConstraintValidationService,
        private readonly compositionValidator: CompositionValidationService,
        private readonly templateValidator: TemplateValidationService,
        private readonly consistencyValidator: ProjectConsistencyValidator,

        private readonly projectAuth: ProjectAuth,
        private readonly notificationService: NotificationService,
        private readonly scopeFilterService: ScopeFilterService,
        private readonly fileStorage: FileStorageService
    ) { }



    private async validateProject(params: ValidateProjectParams): Promise<void> {
        const { grantDoc, projectId, project, phases, label } = params;

        // --- Duplicate title ---
        if (await this.projectRepo.exists({ title: project.title, excludeId: projectId })) {
            throw new AppError(
                ERROR_CODES.PROJECT_ALREADY_EXISTS,
                "A project with this title already exists. Please choose a different title."
            );
        }


        // 1. Consistency (no DB)
        this.consistencyValidator.validateProjectLimits(project);

        if (phases?.length) {
            this.consistencyValidator.validatePhaseAllocations(
                project,
                phases
            );
        }

        // 2. Constraint: project content only
        if (!grantDoc.constraint) return;

        const constraintDoc = await this.constraintValidationService.getConstraint(
            String(grantDoc.constraint)
        );

        const result = this.constraintValidationService.validateProject(
            constraintDoc,
            mapProjectToInput(project)
        );

        if (!result.valid) {
            throw new AppError(
                ERROR_CODES.INVALID_CONSTRAINT,
                `The ${label} project does not satisfy the constraint requirements.`,
                400,
                result
            );
        }
    }

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

        // --- Grant ---
        const grantDoc = await this.grantRepo.findById(grant);

        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);

        if (grantDoc.status !== GrantStatus.active) {
            throw new AppError(ERROR_CODES.GRANT_NOT_ACTIVE);
        }

        await this.validateProject({
            grantDoc,
            project: { ...dto },
            label: "proposed",
        });


        // --- Call and Calendar ---
        let calendarId = calendar;

        if (call) {
            const callDoc = await this.callRepo.findById(call);

            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);

            if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);

            calendarId = String(callDoc.calendar);
        }

        const calendarDoc = await this.calendarRepo.findById(calendarId);

        if (!calendarDoc) throw new AppError(ERROR_CODES.CALENDAR_NOT_FOUND);

        // --- Creator's workspace ---
        const userDoc = await this.userRepo.findById(userId);

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


    async getMyProjectsReadyForNextStage(userId: string) {
        // 1. My projects (no populate: call and currentApplication stay as ids)
        const projects = await this.projectRepo.find({
            status: ProjectStatus.draft,
            leadPI: userId,
        });
        const withApp = projects.filter(p => p.currentApplication);
        if (!withApp.length) return [];

        // 2. Their current applications, accepted only
        const apps = await this.applicationRepo.find({
            ids: withApp.map(p => idOf(p.currentApplication)),
            status: ApplicationStatus.accepted,
        });
        const appById = new Map(apps.map(a => [idOf(a._id), a]));

        const accepted = withApp.filter(p => appById.has(idOf(p.currentApplication)));
        if (!accepted.length) return [];

        // 3. All stages of those calls (NO status filter), so we get both
        //    the accepted application's stage order and the active stage
        const stages = await this.stageRepo.find({
            callIds: [...new Set(accepted.map(p => idOf(p.call)))],
        });
        const stageById = new Map(stages.map(s => [idOf(s._id), s]));
        const activeByCall = new Map(
            stages
                .filter(s => s.status === StageStatus.active)
                .map(s => [idOf(s.call), s])
        );

        // 4. Apply the rule
        const now = Date.now();
        return accepted.flatMap(project => {
            const app = appById.get(idOf(project.currentApplication))!;
            const appStage = stageById.get(idOf(app.stage));
            const active = activeByCall.get(idOf(project.call));

            if (!appStage || !active) return [];                       // missing data / no active stage
            if (active.order !== appStage.order + 1) return [];        // not the very next stage
            if (active.deadline && new Date(active.deadline).getTime() <= now) return []; // closed

            return [{ project, nextStage: active }];
        });
    }


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
            id, userId, PERMISSIONS.PROJECT.UPDATE
        );

        if (isLeadPI) await this.projectAuth.validateOwner(projectDoc);

        if (!PROJECT_EDITABLE_STATES.includes(projectDoc.status)) {
            throw new AppError(ERROR_CODES.PROJECT_NOT_EDITABLE);
        }

        const budgetChanged =
            dto.totalBudget !== undefined &&
            dto.totalBudget !== projectDoc.totalBudget;

        const durationChanged =
            dto.totalDuration !== undefined &&
            dto.totalDuration !== projectDoc.totalDuration;

        const grantDoc = await this.grantRepo.findById(String(projectDoc.grant));
        if (!grantDoc) throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);

        // Only load phases when the change can affect them
        const phases = (budgetChanged || durationChanged)
            ? await this.phaseRepo.find({ project: id })
            : undefined;

        await this.validateProject({
            grantDoc,
            projectId: projectDoc._id.toString(),
            project: mapProjectToInput({ ...projectDoc, ...dto }),
            phases,
            label: "updated"
        });

        return this.projectRepo.update(id, dto, userId);
    }


    private async assertGrantCompliance(projectDoc: IProject): Promise<void> {
        const id = String(projectDoc._id);

        const grantDoc = await this.grantRepo.findById(String(projectDoc.grant));
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        if (grantDoc.constraint) {
            throw new AppError(
                ERROR_CODES.UNSUPPORTED_OPERTATION,
                "Constraint check on grant is not implemented",
                400,
                // result
            );
            /*
            const constraintDoc = await this.constraintValidationService.getConstraint(
                grantDoc.constraint.toString()
            );
            const result = await this.constraintValidationService.validateAll(constraintDoc, id);

            if (!result.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_CONSTRAINT,
                    "Constraint validation failed",
                    400,
                    result
                );
            }
                */
        }

        if (grantDoc.composition) {
            const context: HistoryContextInput = {
                organization: grantDoc.organization.toString(),
                source: grantDoc.fundingSource,
                calendar: projectDoc.calendar?.toString(),
                call: projectDoc.call?.toString(),
            };

            const compositionDoc = await this.compositionValidator.getComposition(
                grantDoc.composition.toString()
            );
            const result = await this.compositionValidator.validateByProjectId(
                compositionDoc,
                context,
                id
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
    }



    private assertProjectBudget(
        projectDoc: IProject,
        phases: IPhase[]
    ) {
        const allocatedPhaseBudget = this.consistencyValidator.getAllocatedPhaseBudget(phases);
        const totalBudget = Number(projectDoc.totalBudget);

        if (Math.abs(totalBudget - allocatedPhaseBudget) > 0.01) {
            throw new AppError(
                ERROR_CODES.PHASE_BUDGET_MISMATCH,
                `The total of all phase budgets (${allocatedPhaseBudget.toFixed(2)}) must equal the project's total budget (${totalBudget.toFixed(2)}).`
            );
        }
    }

    private async assertCallApplication(projectDoc: IProject): Promise<void> {
        if (!projectDoc.call) return;

        if (!projectDoc.currentApplication) {
            throw new AppError(ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND);
        }

        const callDoc = await this.callRepo.findById(String(projectDoc.call));
        if (!callDoc) {
            throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
        }

        const [currentAppDoc, lastStage] = await Promise.all([
            this.applicationService.getById(String(projectDoc.currentApplication)),
            this.stageRepo.getLastStage(String(callDoc._id)),
        ]);

        if (!lastStage) {
            throw new AppError(ERROR_CODES.LAST_STAGE_NOT_FOUND);
        }

        // Project can only be approved from an accepted application
        // that reached the final stage.
        if (currentAppDoc.status !== ApplicationStatus.accepted) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_ACCEPTED,
                "The current application must be accepted before the project can be approved"
            );
        }

        if (String(currentAppDoc.stage) !== String(lastStage._id)) {
            throw new AppError(
                ERROR_CODES.APPLICATION_NOT_AT_FINAL_STAGE,
                "The current application has not reached the final stage"
            );
        }
    }


    private async assertProjectApproval(projectDoc: IProject): Promise<void> {
        const id = projectDoc._id.toString(); // adjust if your id is stored differently

        await this.assertGrantCompliance(projectDoc);

        await this.assertCallApplication(projectDoc);

        const collabs = await this.collabRepo.find({ project: id });
        if (!collabs.every(c => c.status === CollaboratorStatus.verified)) {
            throw new AppError(ERROR_CODES.COLLABORATORS_NOT_FULLY_VERIFIED);
        }

        const phases = await this.phaseRepo.find({ project: id });
        if (!phases.every(p => p.status === PhaseStatus.approved)) {
            throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_APPROVED);
        }

        this.assertProjectBudget(projectDoc, phases);

        const components = await this.componentRepo.find({ project: id });
        if (!components.every(c => c.status === ProjectComponentStatus.approved)) {
            throw new AppError(ERROR_CODES.COMPONENTS_NOT_FULLY_APPROVED);
        }
    }


    private async assertProjectCompletion(projectDoc: IProject): Promise<void> {
        const id = projectDoc._id.toString();

        const phases = await this.phaseRepo.find({ project: id });
        if (!phases.every(p => p.status === PhaseStatus.completed)) {
            throw new AppError(ERROR_CODES.PHASES_NOT_FULLY_COMPLETED);
        }

        this.assertProjectBudget(projectDoc, phases);

        const hasCompletionReport = await this.documentRepo.exists({
            project: id,
            type: PhaseDocumentType.completionReport,
            status: ProjectDocumentStatus.approved,
        });
        if (!hasCompletionReport) {
            throw new AppError(ERROR_CODES.COMPLETION_REPORT_REQUIRED);
        }
    }


    private async assertProjectVerification(projectDoc: IProject): Promise<void> {
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


    private async assertNoActiveVerification(projectDoc: IProject): Promise<void> {
        if (!projectDoc.currentVerification) return;

        const verificationDoc = await this.verificationRepo.findById(
            String(projectDoc.currentVerification)
        );
        if (!verificationDoc) {
            throw new AppError(ERROR_CODES.CURRENT_VERIFICATION_NOT_FOUND);
        }

        switch (verificationDoc.status) {
            case VerificationStatus.submitted:
                throw new AppError(ERROR_CODES.CURRENT_VERIFICATION_SUBMITTED);
            case VerificationStatus.verified:
                throw new AppError(ERROR_CODES.VERIFICATION_ALREADY_VERIFIED);
        }
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
            await this.assertProjectApproval(projectDoc);
        }

        if (to === ProjectStatus.granted) {
            //await this.assertNoActiveVerification(projectDoc)
        }

        if (to === ProjectStatus.completed) {
            await this.assertProjectCompletion(projectDoc);
        }

        if (to === ProjectStatus.verified) {
            await this.assertProjectVerification(projectDoc);
        }


        if (to === ProjectStatus.refused) {
            await this.notificationService.notifyProjectRefusal(
                String(projectDoc.leadPI), projectDoc.title
            );
        }
        //rollback notification remain

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



    async apply(
        id: string,
        dto: ApplyProjectDto,
        userId: string,
        file: Express.Multer.File
    ) {
        try {

            if (!dto.title) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, "Project title is required.");
            }

            if (!dto.themes) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, "Project themes are required.");
            }

            if (dto.totalBudget === undefined || dto.totalDuration === undefined) {
                throw new AppError(ERROR_CODES.INVALID_INPUT, "Budget and duration are required.");
            }

            const userDoc = await this.userRepo.findById(userId);

            if (!userDoc) {
                throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            }


            let collaborators = dto.collaborators ?? [];

            const memberIds = collaborators.map(c => String(c.member))
                .filter(c => c === userId);

            const memberUsers = await this.userRepo.find({
                ids: memberIds,
            });

            if (memberUsers.length !== memberIds.length) {
                throw new AppError(ERROR_CODES.USER_NOT_FOUND);
            }

            // Ensure current user is included as Lead PI
            const currentUserIsMember = collaborators.some(
                c => String(c.member) === String(userId)
            );

            if (currentUserIsMember) {
                collaborators = collaborators.map(c => ({
                    ...c,
                    isLeadPI: String(c.member) === String(userId),
                }));
            } else {
                collaborators.push({
                    member: userId,
                    isLeadPI: true,
                } as CollaboratorDto);
            }


            const callDoc = await this.callRepo.findById(id);
            if (!callDoc) throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
            if (callDoc.status !== CallStatus.active) throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);


            // Composition validation
            const grantDoc = await this.grantRepo.findById(
                String(callDoc.grant)
            );

            if (!grantDoc) {
                throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
            }

            if (grantDoc.composition) {

                const proposed = toCompositionValidationInput(collaborators);

                const compositionDoc =
                    await this.compositionValidator.getComposition(
                        String(grantDoc.composition)
                    );

                const context: HistoryContextInput = {
                    organization: String(grantDoc.organization),
                    source: grantDoc.fundingSource,
                    calendar: String(callDoc.calendar),
                    call: id,
                };

                const compositionResult =
                    await this.compositionValidator.validate(
                        compositionDoc,
                        context,
                        proposed
                    );

                if (!compositionResult.valid) {
                    throw new AppError(
                        ERROR_CODES.INVALID_COMPOSITION,
                        "The proposed members do not satisfy the composition requirements.",
                        400,
                        compositionResult
                    );
                }
            }


            const firstStageDoc = await this.stageRepo.getFirstStage(id);
            if (!firstStageDoc) throw new AppError(ERROR_CODES.FIRST_STAGE_NOT_FOUND);

            if (new Date(firstStageDoc.deadline) < new Date()) {
                throw new AppError(ERROR_CODES.CALL_DEADLINE_PASSED);
            }

            /*
             if (firstStageDoc.constraint) {
            const constantDoc = await this.constraintValidator.getConstraint(firstStageDoc.constraint.toString());
            const result =
                await this.constraintValidator.validateProject
                    (constantDoc, {
                        ...dto, phases: phases?.map((phase, index) => ({
                            ...phase,
                            order: index + 1,
                        }))
                    });

            if (!result?.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_CONSTRAINT,
                    "Stage Constraint validation failed",
                    400,
                    result
                );
            }
                }
                */



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

            const projectDoc = await this.projectRepo.create(
                {
                    ...dto,
                    title: dto.title,
                    themes: dto.themes,
                    totalBudget: dto.totalBudget,
                    totalDuration: dto.totalDuration,
                    workspace: userDoc.workspace?.toString(),
                    call: id,
                    grant: String(callDoc.grant),
                    calendar: String(callDoc.calendar),
                },
                userId
            );

            for (const collab of collaborators) {
                await this.collabService.create(
                    {
                        project: String(projectDoc._id),
                        member: collab.member,
                        role: collab.isLeadPI
                            ? LeaderRole
                            : collab.role,
                    },
                    userId,
                    { skipValidation: true },
                );
            }

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
