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
import { FilterOptions } from "../../../common/dtos/filter.dto";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import ScopeFilterService from "../../../common/services/scope-filter.service";
import { sameId, toObjectId } from "../../../common/utils/mongoose.utils";
import { ApplicationStatus } from "../../applications/application.model";
import { IApplicationRepository } from "../../applications/application.repository";
import { AuthScope } from "../../auth/auth.types";
import { ICallRepository } from "../../calls/call.repository";
import { StageStatus } from "../../calls/stages/stage.model";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { CompositionValidationService, toCompositionValidationInput } from "../../compositions/composition-validation-service";
import { HistoryContextInput } from "../../compositions/history/history-validation-service";
import { ConstraintValidationService, toCollaboratorValidationInput, ValidationOptions } from "../../constraints/services/constraint-validator.service";
import { GrantRepository } from "../../grants/grant.repository";
import { NotificationService } from "../../notifications/notification.service";
import { ProjectAuth } from "../project.auth";
import { IProject, ProjectStatus } from "../project.model";
import { CollaboratorStatus, ICollaborator, LeaderRole } from "./collaborator.model";
import { SYSTEM } from "../../../common/constants/system.constant";

export interface CollaboratorRef {
    member: string;
    isLeadPI: boolean;
    status?: CollaboratorStatus;
}

/**
 * Describes how the project's membership changes:
 *  - create: { add }
 *  - update: { remove: oldMember, add: newMember }
 *  - delete: { remove }
 */
interface MembershipChange {
    add?: CollaboratorRef;
    remove?: string;
}

interface ValidateMembershipParams {
    projectDoc: IProject;
    projectId: string;
    change: MembershipChange;
    /** Wording used in error messages, e.g. "proposed" or "remaining". */
    label: "proposed" | "remaining";
    input: CollaboratorRef[];
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

    private async assertCurrentApplicationStage(projectDoc: IProject) {
        if (projectDoc.status === ProjectStatus.draft &&
            projectDoc.currentApplication) {

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

        }
    }


    /**
 * Returns the collaborator list as it would look after applying `change`.
 */
    private applyMembershipChange(
        input: CollaboratorRef[],
        change: MembershipChange
    ): CollaboratorRef[] {
        const next = input.filter(c => c.member !== change.remove);
        if (change.add !== undefined) {
            next.push(change.add);
        }
        return next;
    }

    /**
     * Validates that the project's grant constraint and composition rules
     * still hold after applying `change`. Used by create, update and delete.
     */
    private async validateMembershipChange(params: ValidateMembershipParams, options?: ValidationOptions): Promise<void> {
        const { projectDoc, projectId, change, label } = params;

        const currentInput = params.input;
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
            const constraintInput = toCollaboratorValidationInput(proposed);

            const constraintResult = this.constraintValidator.validateCollaborators(
                constraintDoc,
                constraintInput,
                options
            );
            if (!constraintResult.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_CONSTRAINT,
                    `The ${label} members do not satisfy the constraint requirements.`,
                    400,
                    constraintResult
                );
            }
        }

        // Composition validation
        if (grantDoc.composition) {
            const compositionInput = toCompositionValidationInput(proposed);
            if (!compositionInput.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_COMPOSITION,
                    `The ${label} members do not satisfy the composition requirements.`,
                    400,
                    compositionInput
                );
            }

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
                compositionInput.input,          // unwrapped
                projectId
            );
            if (!compositionResult.valid) {
                throw new AppError(
                    ERROR_CODES.INVALID_COMPOSITION,
                    `The ${label} members do not satisfy the composition requirements.`,
                    400,
                    compositionResult
                );
            }
        }
    }

    private toCollaboratorRefs(collabs: ICollaborator[]): CollaboratorRef[] {
        return collabs.map(c => ({
            member: String(c.member),
            isLeadPI: !!c.isLeadPI,
            status: c.status as CollaboratorStatus,
        }));
    }

    // ---------------------------------------------------------------------
    // Create
    // ---------------------------------------------------------------------

    async create(dto: CreateCollaboratorDto, userId: string, options?: { skipValidation?: boolean }) {

        try {
            const { member, project, role } = dto;

            let isLeadRole = role === LeaderRole;

            const { projectDoc, isLeadPI } = await this.projectAuth.auth(
                project,
                userId,
                PERMISSIONS.COLLABORATOR.CREATE
            );

            if (isLeadPI) {
                if (projectDoc.status !== ProjectStatus.draft) {
                    throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
                }
                await this.assertCurrentApplicationStage(projectDoc);
            }

            const currentCollabs = await this.collabRepo.find({ project: project });

            // 1. Member is already part of this project
            const alreadyMember = currentCollabs.some(c => c.member.toString() === member);
            if (alreadyMember) {
                throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
            }

            // 2. Only one lead per project
            if (isLeadRole) {
                const leadExists = currentCollabs.some(c => c.isLeadPI);
                if (leadExists) {
                    throw new AppError(ERROR_CODES.PROJECT_LEAD_ALREADY_EXISTS);
                }
            }

            await this.validateMembershipChange({
                projectDoc,
                projectId: project,
                change: { add: { member, isLeadPI: isLeadRole } },
                label: "proposed",
                input: this.toCollaboratorRefs(currentCollabs),
            },
                { skipMin: true });

            const created = await this.collabRepo.create({
                ...dto,
                status: member === userId ? CollaboratorStatus.verified : undefined,
                isLeadPI: isLeadRole
            }, userId);
            //await this.collabRepo.updateFemaleProportionByProject(project);
            if (member !== userId) {
                await this.notificationService.notifyProjectInvitation(
                    member, projectDoc.title, dto.role, userId
                );
            }
            if (isLeadRole) {
                await this.projectRepo.update(project, { leadPI: member }, SYSTEM.SU_USER);
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

    async update(
        id: string,
        dto: UpdateCollaboratorDto,
        userId: string
    ): Promise<ICollaborator | null> {

        const collaboratorDoc = await this.collabRepo.findById(id);
        if (!collaboratorDoc) {
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        }

        const projectId = String(collaboratorDoc.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.COLLABORATOR.UPDATE
        );

        // The lead PI can update collaborators only while the project is in draft.
        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }
            await this.assertCurrentApplicationStage(projectDoc);
        }

        // What is this update actually doing?
        const oldMember = String(collaboratorDoc.member);
        const newMember = dto.member ?? oldMember;
        const isMemberChange = newMember !== oldMember;
        const wasLead = collaboratorDoc.isLeadPI;
        const isBecomingLead = dto.role === LeaderRole && !wasLead;

        // The current lead can't be replaced or demoted directly.
        if (wasLead && (isMemberChange || (dto.role !== undefined && dto.role !== LeaderRole))) {
            throw new AppError(ERROR_CODES.LEAD_PI_CANNOT_BE_UPDATED);
        }

        if (isMemberChange) {
            if (collaboratorDoc.status === CollaboratorStatus.verified) {
                throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_VERIFIED);
            }

            const exists = await this.collabRepo.exists({
                project: projectId,
                member: newMember
            });

            if (exists) {
                throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
            }
        }

        // Validate the proposed team when the member changes or the lead is exchanged.
        let currentLead: ICollaborator | undefined;

        if (isMemberChange || isBecomingLead) {
            const currentCollabs = await this.collabRepo.find({ project: projectId });

            currentLead = currentCollabs.find(
                c => c.isLeadPI && !sameId(c._id, id)
            );

            const proposedInput = this.toCollaboratorRefs(currentCollabs).map(ref =>
                isBecomingLead && currentLead && sameId(
                    ref.member,
                    currentLead.member.toString()
                )
                    ? { ...ref, isLeadPI: false }
                    : ref
            );

            await this.validateMembershipChange({
                projectDoc,
                projectId,
                change: {
                    remove: oldMember,
                    add: {
                        member: newMember,
                        isLeadPI: isBecomingLead
                    },
                },
                label: "proposed",
                input: proposedInput,
            });
        }

        // Persist after all authorization and validation.
        if (isBecomingLead && currentLead) {
            await this.collabRepo.update(
                String(currentLead._id),
                { isLeadPI: false, role: "DemotedLeadRole" },
                userId
            );
        }

        let updatedCollaborator: ICollaborator | null;

        try {
            updatedCollaborator = await this.collabRepo.update(
                id,
                isBecomingLead ? { ...dto, isLeadPI: true } : dto,
                userId
            );
            if (isBecomingLead) {
                await this.projectRepo.update(projectId, { leadPI: dto.member }, SYSTEM.SU_USER);
            }
        } catch (err) {
            // Restore the old lead if promoting the new one failed.
            if (isBecomingLead && currentLead) {
                await this.collabRepo.update(
                    String(currentLead._id),
                    { isLeadPI: true, role: LeaderRole },
                    userId
                );
                await this.projectRepo.update(projectId, { leadPI: currentLead.member.toString() }, SYSTEM.SU_USER);
            }
            throw err;
        }

        // Don't send notifications if the update returned null.
        if (!updatedCollaborator) {
            return null;
        }

        // Notify only after the write succeeded.
        const projectTitle = projectDoc.title;
        const newRole = dto.role ?? collaboratorDoc.role;

        if (isMemberChange) {
            // Old member is removed, new member is invited.
            await this.notificationService.notifyCollaboratorRemovedFromProject(
                oldMember,
                projectTitle,
                collaboratorDoc.role,
                userId
            );

            await this.notificationService.notifyProjectInvitation(
                newMember,
                projectTitle,
                newRole,
                userId
            );

        } else if (
            dto.role !== undefined &&
            dto.role !== collaboratorDoc.role
        ) {
            await this.notificationService.notifyCollaboratorUpdate(
                oldMember,
                projectTitle,
                newRole,
                collaboratorDoc.role,
                userId
            );
        }

        // Lead exchange: notify the demoted lead too.
        if (isBecomingLead && currentLead) {
            await this.notificationService.notifyCollaboratorUpdate(
                String(currentLead.member),
                projectTitle,
                "DemotedLeadRole",
                LeaderRole,
                userId
            );
        }

        return updatedCollaborator;
    }

    // ---------------------------------------------------------------------
    // Transition
    // ---------------------------------------------------------------------

    async transitionState(dto: TransitionRequestDto, userId: string, userName: string) {
        const { id, current, next, reason } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);

        if (String(collabDoc.member) !== userId) {
            // use permission for the special permission
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        const projectDoc = await this.projectRepo.findById(String(collabDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        await this.assertCurrentApplicationStage(projectDoc);

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

        const updated = await this.collabRepo.update(id, {
            status: to,
            statusHistory: {
                status: to,
                changedBy: toObjectId(userId),
                reason,
                changedAt: new Date(),
            },
        }, userId);

        if (!updated) return null;

        // Resolve these from your project and collaborator records.
        const recipientId = String(projectDoc.createdBy);

        if (updated.status === CollaboratorStatus.pending) {
            //... pending remained
        }

        if (updated.status === CollaboratorStatus.verified) {
            await this.notificationService.notifyCollaboratorVerified(
                recipientId,
                projectDoc.title,
                userName,
                userId
            );
        }

        if (updated?.status === CollaboratorStatus.declined) {
            await this.notificationService.notifyCollaboratorDeclined(
                recipientId,
                projectDoc.title,
                userName,
                collabDoc.role,
                reason,
                userId
            );
        }

        return updated;
    }

    async delete(dto: DeleteDto, userId: string) {
        const { id } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) {
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        }

        const projectId = String(collabDoc.project);

        const { projectDoc, isLeadPI } = await this.projectAuth.auth(
            projectId,
            userId,
            PERMISSIONS.COLLABORATOR.DELETE
        );

        if (collabDoc.isLeadPI) {
            throw new AppError(ERROR_CODES.COLLABORATOR_LEAD_PI_CANNOT_DELETE);
        }

        if (collabDoc.status === CollaboratorStatus.verified) {
            throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_VERIFIED);
        }

        // The lead PI can remove collaborators only while the project is in draft.
        if (isLeadPI) {
            if (projectDoc.status !== ProjectStatus.draft) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }
            await this.assertCurrentApplicationStage(projectDoc);
        }

        const memberToRemove = String(collabDoc.member);

        // Validate the team that would remain after the removal.
        const currentCollabs = await this.collabRepo.find({ project: projectId });

        await this.validateMembershipChange(
            {
                projectDoc,
                projectId,
                change: { remove: memberToRemove },
                label: "remaining",
                input: this.toCollaboratorRefs(currentCollabs),
            },
            { skipMin: true }
        );

        // Delete only after all validations pass.
        const deleted = await this.collabRepo.delete(id);

        await this.notificationService.notifyCollaboratorRemovedFromProject(
            memberToRemove,
            projectDoc.title,
            collabDoc.role
        );

        return deleted;
    }
}


export const COLLAB_TRANSITIONS: Record<
    CollaboratorStatus, CollaboratorStatus[]> = {
    [CollaboratorStatus.pending]: [CollaboratorStatus.verified, CollaboratorStatus.declined],
    [CollaboratorStatus.verified]: [CollaboratorStatus.pending],
    [CollaboratorStatus.declined]: [CollaboratorStatus.pending]
};