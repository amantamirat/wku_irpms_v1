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
import { ICallRepository } from "../../calls/call.repository";
import { ConstraintValidationService } from "../../constraints/services/constraint-validator.service";
import { NotificationService } from "../../notifications/notification.service";
import { ProjectAuth } from "../project.auth";
import { ProjectStatus } from "../project.model";
import { CollaboratorStatus } from "./collaborator.model";
import { IApplicationRepository } from "../applications/application.repository";
import { ApplicationStatus } from "../applications/application.model";


export class CollaboratorService {

    constructor(
        private readonly collabRepo: ICollaboratorRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly callRepo: ICallRepository,
        private readonly applicationRepo: IApplicationRepository,
        private readonly constraintValidator: ConstraintValidationService,
        private readonly projectAuth: ProjectAuth,
        private readonly notificationService: NotificationService,
    ) {
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

                if (projectDoc.currentApplication) {
                    const currentAppDoc = await this.applicationRepo.findById(String(projectDoc.currentApplication));
                    if (currentAppDoc?.status === ApplicationStatus.pending) {
                        throw new AppError(ERROR_CODES.CURRENT_APPLICATION_IS_PENDING);
                    }
                }
            }

            
            if (projectDoc.call) {
                const callId = String(projectDoc.call);
                const callDoc = await this.callRepo.findById(callId);
                if (!callDoc) {
                    throw new AppError(
                        ERROR_CODES.CALL_NOT_FOUND
                    );
                }
                if (callDoc.constraint) {
                    const constraintId = String(callDoc.constraint);
                    const result = await this.constraintValidator.validateParticipantCount(constraintId, await this.collabRepo.countByProject(project) + 1);
                    if (!result.valid) {
                        throw new AppError(ERROR_CODES.INVALID_CONSTRAINT, "participant count", 400, result);
                    }
                }
                /*
                if (dto.isLeadPI) {
                    // await this.compositionValidator.validatePI(grantId, applicant);
                } else {
                    //  await this.compositionValidator.validateCoPI(grantId, applicant);
                }*/
            }
        }
        try {
            const created = await this.collabRepo.create(dto);
            await this.projectRepo.incrementTotals(project, { collabs: 1 });
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

    async get(filter: FilterCollaborators, options?: FilterOptions) {
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


    async update(dto: UpdateCollaboratorDto) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        /*
        const { id, data } = dto;
        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        if (collabDoc.status !== CollaboratorStatus.pending)
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_PENDING);
        return await this.collabRepo.update(id, data);*/
    }



    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        // if (collabDoc.isLeadPI === true) throw new AppError(ERROR_CODES.USER_LEAD_PI);

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
            const projectDoc = await this.projectRepo.findById(String(collabDoc.project));
            if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);
            const projectStatus = projectDoc.status;
            if (projectStatus !== ProjectStatus.draft //&&
                // projectStatus !== ProjectStatus.submitted // &&
                // projectStatus !== ProjectStatus.accepted
            ) {
                throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
            }
        }

        return await this.collabRepo.updateStatus(id,
            to
        );
    }


    async delete(dto: DeleteDto, userId: string) {
        const { id } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        if (collabDoc.isLeadPI) {
            throw new AppError(ERROR_CODES.COLLABORATOR_LEAD_PI_CANNOT_DELETE);
        }
        if (collabDoc.status !== CollaboratorStatus.pending) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_PENDING);

        const project = String(collabDoc.project);
        const { projectDoc, isLeadPI } = await this.projectAuth.auth(project, userId, PERMISSIONS.COLLABORATOR.DELETE);

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
        return deleted;
    }
}


export const COLLAB_TRANSITIONS: Record<
    CollaboratorStatus, CollaboratorStatus[]> = {
    [CollaboratorStatus.pending]: [CollaboratorStatus.verified, CollaboratorStatus.declined],
    [CollaboratorStatus.verified]: [CollaboratorStatus.pending],
    [CollaboratorStatus.declined]: [CollaboratorStatus.pending]
};
