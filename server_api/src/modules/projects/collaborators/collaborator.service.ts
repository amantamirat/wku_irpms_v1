// collaborator.service.ts
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IProjectRepository } from "../project.repository";
import {
    CreateCollaboratorDto,
    FilterCollaborators,
    UpdateCollaboratorDto
} from "./collaborator.dto";
import { ICollaboratorRepository } from "./collaborator.repository";

import { PERMISSIONS } from "../../../common/constants/permissions";
import { SYSTEM } from "../../../common/constants/system.constant";
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import ScopeFilterService from "../../../common/services/scope-filter.service";
import { IApplicationRepository } from "../../applications/application.repository";
import { AuthScope } from "../../auth/auth.types";
import { CallStatus } from "../../calls/call.model";
import { ICallRepository } from "../../calls/call.repository";
import { StageStatus } from "../../calls/stages/stage.model";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { CollaboratorValidationInput, ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { NotificationService } from "../../notifications/notification.service";
import { ProjectAuth } from "../project.auth";
import { IProject, ProjectStatus } from "../project.model";
import { CollaboratorStatus, ICollaborator } from "./collaborator.model";
import { CompositionValidationInput, CompositionValidationService } from "../../compositions/composition-validation-service";
import { GrantRepository } from "../../grants/grant.repository";
import { ApplicationStatus } from "../../applications/application.model";
import { HistoryContextInput } from "../../compositions/history/history-validation-service";

/**
 * Describes how the project's membership changes:
 *  - create: { add }
 *  - update: { remove: oldMember, add: newMember }
 *  - delete: { remove }
 */
interface MembershipChange {
    add?: string;
    remove?: string;
}

interface ValidateMembershipParams {
    projectDoc: IProject;
    projectId: string;
    change: MembershipChange;
    /** Wording used in error messages, e.g. "proposed" or "remaining". */
    label: "proposed" | "remaining";
    /** Pass when the caller has already loaded it, to avoid a second fetch. */
    currentInput?: CompositionValidationInput;
}

export class CollaboratorService {

    constructor(
        private readonly collabRepo: ICollaboratorRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantRepo: GrantRepository,
        private readonly callRepo: ICallRepository,
        private readonly stageRepo: IStageRepository,
        private readonly applicationRepo: IApplicationRepository,
        private readonly constraintValidator: ConstraintValidationService,
        private readonly compositionValidator: CompositionValidationService,
        private readonly projectAuth: ProjectAuth,
        private readonly notificationService: NotificationService,
        private readonly scopeFilterService: ScopeFilterService,
    ) {
    }

    // ---------------------------------------------------------------------
    // Shared validation helpers
    // ---------------------------------------------------------------------

    private async validateCall(projectDoc: IProject) {
        if (projectDoc.call) {
            const callDoc = await this.callRepo.findById(projectDoc.call.toString());
            if (!callDoc) {
                throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
            }
            if (callDoc.status !== CallStatus.active) {
                throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);
            }

            if (!projectDoc.currentApplication) {
                throw new AppError(ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND);
            }
            const currentAppDoc = await this.applicationRepo.findById(String(projectDoc.currentApplication));
            if (!currentAppDoc) {
                throw new AppError(ERROR_CODES.CURRENT_APPLICATION_NOT_FOUND);
            }

            if (currentAppDoc.status !== ApplicationStatus.submitted) {
                throw new AppError(ERROR_CODES.APPLICATION_NOT_IN_SUBMITTED_STATE);
            }

            const stageDoc = await this.stageRepo.findById(currentAppDoc.stage.toString());
            if (!stageDoc) {
                throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            }
            if (stageDoc.status !== StageStatus.active) {
                throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
            }
            return callDoc;
        }
    }

    /**
     * Loads the project's current composition input (lead + members).
     * Throws INVALID_COMPOSITION if it cannot be resolved.
     */
    private async getCompositionInput(projectId: string): Promise<CompositionValidationInput> {
        const result = await this.compositionValidator.getCompositionInputByProjectId(projectId);
        if (!result.ok) {
            throw new AppError(ERROR_CODES.INVALID_COMPOSITION, "", 404, result.errors);
        }
        return result.input;
    }

    /**
     * Returns the composition input as it would look after applying `change`.
     */
    private applyMembershipChange(
        input: CompositionValidationInput,
        change: MembershipChange
    ): CompositionValidationInput {
        const members = input.members.filter(m => m !== change.remove);
        if (change.add !== undefined) {
            members.push(change.add);
        }
        return { lead: input.lead, members };
    }

    /**
     * Validates that the project's grant constraint and composition rules
     * still hold after applying `change`. Used by create, update and delete.
     */
    private async validateMembershipChange(params: ValidateMembershipParams): Promise<void> {
        const { projectDoc, projectId, change, label } = params;

        const currentInput = params.currentInput ?? await this.getCompositionInput(projectId);
        const proposed = this.applyMembershipChange(currentInput, change);

        const grantDoc = await this.grantRepo.findById(String(projectDoc.grant));
        if (!grantDoc) {
            throw new AppError(ERROR_CODES.GRANT_NOT_FOUND);
        }

        // Constraint validation
        if (grantDoc.constraint) {
            const constraintDoc = await this.constraintValidator.getConstraint(
                String(grantDoc.constraint)
            );
            const collaborators: CollaboratorValidationInput[] = [
                proposed.lead,
                ...proposed.members,
            ].map(member => ({
                member,
            }));
            const constraintResult = this.constraintValidator.validateCollaborators(
                constraintDoc,
                collaborators
            );
            if (!constraintResult.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_CONSTRAINT,
                    `The ${label} members do not satisfy the constraint requirements.`,
                    400,
                    constraintResult.errors
                );
            }
        }

        // Composition validation
        if (grantDoc.composition) {
            const compositionDoc = await this.compositionValidator.getComposition(
                String(grantDoc.composition)
            );
            const context: HistoryContextInput = {
                organization: grantDoc.organization.toString(),
                source: grantDoc.fundingSource,
                calendar: projectDoc.calendar?.toString(),
                call: projectDoc.call?.toString(),
            };
            const compositionResult = await this.compositionValidator.validate(
                compositionDoc,
                context,
                proposed,
                projectId
            );
            if (!compositionResult.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_COMPOSITION,
                    `The ${label} members do not satisfy the composition requirements.`,
                    400,
                    compositionResult.errors
                );
            }
        }
    }

    // ---------------------------------------------------------------------
    // Create
    // ---------------------------------------------------------------------

    async create(dto: CreateCollaboratorDto, userId: string, options?: { skipValidation?: boolean }) {
        const { member, project } = dto;


        let projectTitle = dto.projectTitle;
        if (!options?.skipValidation) {

            const currentInput = await this.getCompositionInput(project);

            const memberExists =
                currentInput.lead === member ||
                currentInput.members.includes(member);

            if (memberExists) {
                throw new AppError(
                    ERROR_CODES.COLLABORATOR_ALREADY_EXISTS,
                    'This member is already a collaborator on the project.',
                );
            }

            const { projectDoc, isLeadPI } = await this.projectAuth.auth(
                project,
                userId,
                PERMISSIONS.COLLABORATOR.CREATE
            );
            projectTitle = projectDoc.title;

            if (isLeadPI) {
                if (projectDoc.status !== ProjectStatus.draft) {
                    throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
                }
                await this.validateCall(projectDoc);
            }

            await this.validateMembershipChange({
                projectDoc,
                projectId: project,
                change: { add: member },
                label: "proposed",
                currentInput,
            });
        }

        try {
            const created = await this.collabRepo.create(dto);
            await this.collabRepo.updateFemaleProportionByProject(project);
            if (dto.status !== CollaboratorStatus.verified) {
                await this.notificationService.notifyProjectInvitation(
                    member, projectTitle ?? project, dto.role, userId
                );
            }
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    // ---------------------------------------------------------------------
    // Read
    // ---------------------------------------------------------------------

    async read(filter: FilterCollaborators, scope: AuthScope, options?: FilterOptions) {
        const scopeFilter =
            await this.scopeFilterService.getCollaboratorFilter(scope);
        return this.collabRepo.find(filter, options, scopeFilter);
    }

    async look(filter: FilterCollaborators, options?: FilterOptions) {
        return this.collabRepo.find(filter, options);
    }

    getMyCollaborations = async (
        userId: string,
        filter?: Partial<FilterCollaborators>,
        options?: FilterOptions
    ) => {
        return this.collabRepo.find(
            {
                ...filter,
                member: userId
            },
            {
                ...options,
                populate: true
            }
        );
    };

    // ---------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------

    async update(
        dto: UpdateCollaboratorDto,
        userId: string
    ): Promise<ICollaborator | null> {

        const collaboratorDoc = await this.collabRepo.findById(dto.id);

        if (!collaboratorDoc) {
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        }

        const projectId = String(collaboratorDoc.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.COLLABORATOR.UPDATE
        );

        // The lead PI collaborator record cannot be updated.
        if (collaboratorDoc.isLeadPI) {
            throw new AppError(ERROR_CODES.LEAD_PI_CANNOT_BE_UPDATED);
        }

        // Only pending and declined collaborators can be updated.
        if (collaboratorDoc.status === CollaboratorStatus.verified) {
            throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_VERIFIED);
        }

        // The lead PI can update collaborators only while the project is in draft.
        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }
            await this.validateCall(projectDoc);
        }

        if (dto.data.member !== undefined) {
            const newMember = dto.data.member;
            const oldMember = String(collaboratorDoc.member);

            if (newMember !== oldMember) {
                // Prevent duplicate membership in the same project.
                const exists = await this.collabRepo.exists({
                    project: projectId,
                    member: newMember
                });
                if (exists) {
                    throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
                }

                await this.validateMembershipChange({
                    projectDoc,
                    projectId,
                    change: { remove: oldMember, add: newMember },
                    label: "proposed",
                });
            }
        }

        // Persist the update after all authorization and validation.
        const updated = await this.collabRepo.update(dto.id, dto.data, userId);

        await this.collabRepo.updateFemaleProportionByProject(projectId);

        return updated;
    }

    // ---------------------------------------------------------------------
    // Transition
    // ---------------------------------------------------------------------

    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next, reason } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);

        if (String(collabDoc.member) !== userId) {
            // use permission for the special permission
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }
        const projectDoc = await this.projectRepo.findById(String(collabDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);
        await this.validateCall(projectDoc);

        const from = collabDoc.status as CollaboratorStatus;
        const to = next as CollaboratorStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(from, to, COLLAB_TRANSITIONS);

        if (next === CollaboratorStatus.pending) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
            }
        }

        return this.collabRepo.updateStatus(id, to, userId, reason);
    }

    // ---------------------------------------------------------------------
    // Delete
    // ---------------------------------------------------------------------

    async delete(dto: DeleteDto, userId: string) {
        const { id } = dto;

        const collabDoc = await this.collabRepo.findById(id);

        if (!collabDoc) {
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        }

        if (collabDoc.isLeadPI) {
            throw new AppError(ERROR_CODES.COLLABORATOR_LEAD_PI_CANNOT_DELETE);
        }

        if (collabDoc.status === CollaboratorStatus.verified) {
            throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_VERIFIED);
        }

        const projectId = String(collabDoc.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.COLLABORATOR.DELETE
        );



        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft)
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            await this.validateCall(projectDoc);
        }

        const memberToRemove = String(collabDoc.member);

        await this.validateMembershipChange({
            projectDoc,
            projectId,
            change: { remove: memberToRemove },
            label: "remaining",
        });

        // Delete only after all validations pass.
        const deleted = await this.collabRepo.delete(id);

        await this.notificationService.notifyProjectRemoval(
            memberToRemove,
            projectDoc.title,
            collabDoc.role
        );

        await this.collabRepo.updateFemaleProportionByProject(projectId);

        return deleted;
    }
}


export const COLLAB_TRANSITIONS: Record<
    CollaboratorStatus, CollaboratorStatus[]> = {
    [CollaboratorStatus.pending]: [CollaboratorStatus.verified, CollaboratorStatus.declined],
    [CollaboratorStatus.verified]: [CollaboratorStatus.pending],
    [CollaboratorStatus.declined]: [CollaboratorStatus.pending]
};