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
import { AuthScope } from "../../auth/auth.types";
import ScopeFilterService from "../../../common/services/scope-filter.service";
import { ICallRepository } from "../../calls/call.repository";
import { ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { NotificationService } from "../../notifications/notification.service";
import { ApplicationStatus } from "../applications/application.model";
import { IApplicationRepository } from "../applications/application.repository";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import { CollaboratorStatus, ICollaborator } from "./collaborator.model";
import { CompositionValidationService } from "../../compositions/composition-validator.service";
import { IStageRepository } from "../../calls/stages/stage.repository";
import { CallStatus } from "../../calls/call.model";


export class CollaboratorService {

    constructor(
        private readonly collabRepo: ICollaboratorRepository,
        private readonly projectRepo: IProjectRepository,
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

    private async validateCall(callId: string) {
        const callDoc = await this.callRepo.findById(callId);
        if (!callDoc) {
            throw new AppError(
                ERROR_CODES.CALL_NOT_FOUND
            );
        }
        if (callDoc.status !== CallStatus.active) {
            throw new AppError(ERROR_CODES.CALL_NOT_ACTIVE);
        }
        return callDoc;
    }

    async create(dto: CreateCollaboratorDto, options?: { skipValidation?: boolean }) {
        const { member, project, userId } = dto;
        let projectTitle = dto.projectTitle;
        if (!options?.skipValidation) {
            if (!userId) return;
            const { projectDoc, isLeadPI } = await this.projectAuth.auth(project, userId, PERMISSIONS.COLLABORATOR.CREATE);
            projectTitle = projectDoc.title;
            if (isLeadPI) {
                if (
                    projectDoc.status !== ProjectStatus.draft
                ) {
                    throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
                }

                /*
                if (projectDoc.currentApplication) {
                    const currentAppDoc = await this.applicationRepo.findById(String(projectDoc.currentApplication));
                    if (currentAppDoc?.status === ApplicationStatus.submitted) {
                        throw new AppError(ERROR_CODES.CURRENT_APPLICATION_IS_PENDING);
                    }
                }*/
            }


            if (projectDoc.call) {
                const callId = String(projectDoc.call);
                const callDoc = await this.validateCall(callId);
                if (callDoc.constraint) {
                    const constraintId = String(callDoc.constraint);
                    const result = await this.constraintValidator.validateParticipantCount(constraintId, await this.collabRepo.countByProject(project) + 1);
                    if (!result.valid) {
                        throw new AppError(ERROR_CODES.INVALID_CONSTRAINT, "participant count", 400, result);
                    }
                }

                if (dto.isLeadPI) {
                    // await this.compositionValidator.validatePI(grantId, applicant);
                } else {
                    //  await this.compositionValidator.validateCoPI(grantId, applicant);
                    if (callDoc.composition) {
                        const stageDoc = await this.stageRepo.getFirstStage(
                            String(projectDoc.call)
                        );

                        if (!stageDoc) {
                            throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
                        }

                        const results =
                            await this.compositionValidator.validateMember(
                                String(callDoc.composition),
                                member,
                                callDoc,
                                stageDoc
                            );

                        if (!results.valid) {
                            throw new AppError(
                                ERROR_CODES.INVALID_COMPOSITION,
                                "The proposed member does not satisfy the composition requirements.",
                                400,
                                // results.errors
                            );
                        }
                    }
                }


            }
        }
        try {
            const created = await this.collabRepo.create(dto);
            await this.projectRepo.incrementTotals(project, { collabs: 1 });
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

    async read(filter: FilterCollaborators, scope: AuthScope, options?: FilterOptions) {
        const scopeFilter =
            await this.scopeFilterService.getCollaboratorFilter(scope);
        const collaborators = await this.collabRepo.find(filter, options, scopeFilter);
        return collaborators;
    }

    async look(filter: FilterCollaborators, options?: FilterOptions) {
        const collaborators = await this.collabRepo.find(filter, options);
        return collaborators;
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


    /**
 * Update collaborator.
 */

    /**
     * Update collaborator.
     */
    async update(
        dto: UpdateCollaboratorDto,
        userId: string
    ): Promise<ICollaborator | null> {

        const collaboratorDoc = await this.collabRepo.findById(dto.id);

        if (!collaboratorDoc) {
            throw new AppError(
                ERROR_CODES.COLLABORATOR_NOT_FOUND
            );
        }

        // Authorize the user against the collaborator's project.
        const projectId = String(collaboratorDoc.project);

        const { projectDoc, isLeadPI } =
            await this.projectAuth.auth(
                projectId,
                userId,
                PERMISSIONS.COLLABORATOR.UPDATE
            );

        if (projectDoc.call) {
            const callId = String(projectDoc.call);
            const callDoc = await this.validateCall(callId);
        }

        // Only pending and declined collaborators can be updated.
        if (
            collaboratorDoc.status === CollaboratorStatus.verified
        ) {
            throw new AppError(
                ERROR_CODES.COLLABORATOR_ALREADY_VERIFIED
            );
        }

        // The lead PI collaborator record cannot be updated.
        if (collaboratorDoc.isLeadPI) {
            throw new AppError(
                ERROR_CODES.LEAD_PI_CANNOT_BE_UPDATED
            );
        }

        // The lead PI can update collaborators only while
        // the project is in draft status.
        if (
            isLeadPI &&
            projectDoc.status !== ProjectStatus.draft
        ) {
            throw new AppError(
                ERROR_CODES.PROJECT_NOT_DRAFT
            );
        }

        // Prevent duplicate membership in the same project.

        if (dto.data.member !== undefined) {
            // Prevent duplicate membership in the same project.
            const exists = await this.collabRepo.exists({
                project: projectId,
                member: dto.data.member
            });

            if (
                exists &&
                dto.data.member !== String(collaboratorDoc.member)
            ) {
                throw new AppError(
                    ERROR_CODES.COLLABORATOR_ALREADY_EXISTS
                );
            }

            // Validate the proposed member against the composition.
            if (projectDoc.call) {
                const callDoc = await this.callRepo.findById(
                    String(projectDoc.call)
                );

                if (!callDoc) {
                    throw new AppError(ERROR_CODES.CALL_NOT_FOUND);
                }

                if (callDoc.composition) {
                    const stageDoc = await this.stageRepo.getFirstStage(
                        String(projectDoc.call)
                    );

                    if (!stageDoc) {
                        throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
                    }

                    const results =
                        await this.compositionValidator.validateMember(
                            String(callDoc.composition),
                            dto.data.member,
                            callDoc,
                            stageDoc
                        );

                    if (!results.valid) {
                        throw new AppError(
                            ERROR_CODES.INVALID_COMPOSITION,
                            "The proposed member does not satisfy the composition requirements.",
                            400,
                            // results.errors
                        );
                    }
                }
            }
        }

        // Persist the update after all authorization and validation.
        const updated = this.collabRepo.update(
            dto.id,
            dto.data,
            userId
        );

        await this.collabRepo.updateFemaleProportionByProject(projectId);

        return updated;
    }




    async transitionState(dto: TransitionRequestDto, userId: string) {
        const { id, current, next } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        // if (collabDoc.isLeadPI === true) throw new AppError(ERROR_CODES.USER_LEAD_PI);
        const projectDoc = await this.projectRepo.findById(String(collabDoc.project));
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);
        if (projectDoc.call) {
            const callId = String(projectDoc.call);
            await this.validateCall(callId);
        }

        if (String(collabDoc.member) !== userId) {
            //use permission for the special permission
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        const from = collabDoc.status as CollaboratorStatus;
        const to = next as CollaboratorStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            COLLAB_TRANSITIONS
        );

        if (next === CollaboratorStatus.pending) {

            const projectStatus = projectDoc.status;
            if (projectStatus !== ProjectStatus.draft
            ) {
                throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
            }
        }

        const updated = await this.collabRepo.updateStatus(id,
            to
        );

        await this.collabRepo.updateVerifiedCollaboratorsProportionByProject(String(collabDoc.project));

        return updated;
    }


    async delete(dto: DeleteDto, userId: string) {
        const { id } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        if (collabDoc.isLeadPI) {
            throw new AppError(ERROR_CODES.COLLABORATOR_LEAD_PI_CANNOT_DELETE);
        }
        if (collabDoc.status === CollaboratorStatus.verified) throw new AppError(ERROR_CODES.COLLABORATOR_ALREADY_VERIFIED);

        const project = String(collabDoc.project);
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(project, userId, PERMISSIONS.COLLABORATOR.DELETE);

        if (projectDoc.call) {
            const callId = String(projectDoc.call);
            await this.validateCall(callId);
        }

        if (isLeadPI) {
            if (
                projectDoc.status !== ProjectStatus.draft
            ) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_DRAFT);
            }
        }


        if (projectDoc.call) {
            const callDoc = await this.callRepo.findById(String(projectDoc.call));
            if (!callDoc) {
                throw new AppError(
                    ERROR_CODES.CALL_NOT_FOUND
                );
            }
            if (callDoc.constraint) {
                const countCollabs = projectDoc.totalCollabs ?? 0;
                const validationResult = await this.constraintValidator.validateParticipantCount(String(callDoc.constraint), countCollabs - 1);
                if (!validationResult.valid) {
                    throw new AppError(ERROR_CODES.INVALID_CONSTRAINT, "participant count", 400, validationResult);
                }
            }
        }

        const deleted = this.collabRepo.delete(id);
        await this.projectRepo.incrementTotals(project, { collabs: -1 });
        if (!collabDoc.isLeadPI) {
            await this.notificationService.notifyProjectRemoval(
                String(collabDoc.member), projectDoc.title, collabDoc.role
            );
        }
        await this.collabRepo.updateFemaleProportionByProject(project);
        return deleted;
    }
}


export const COLLAB_TRANSITIONS: Record<
    CollaboratorStatus, CollaboratorStatus[]> = {
    [CollaboratorStatus.pending]: [CollaboratorStatus.verified, CollaboratorStatus.declined],
    [CollaboratorStatus.verified]: [CollaboratorStatus.pending],
    [CollaboratorStatus.declined]: [CollaboratorStatus.pending]
};
