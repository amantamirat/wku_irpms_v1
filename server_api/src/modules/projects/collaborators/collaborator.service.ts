// collaborator.service.ts
import { SYSTEM } from "../../../common/constants/system.constant";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IUserRepository } from "../../users/user.repository";
import { IProjectRepository } from "../project.repository";
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions,
    UpdateCollaboratorDto
} from "./collaborator.dto";
import { ICollaboratorRepository } from "./collaborator.repository";

import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ConstraintValidator } from "../../grants/constraints/constraint.validator";
import { ProjectStatus } from "../project.model";
import { CollaboratorStatus } from "./collaborator.model";
import { ClientSession } from "mongoose";
import { ProjectAuth } from "../project.auth";
import { NotificationService } from "../../notifications/notification.service";
import { CompositionValidator } from "../../grants/compositions/composition.validator";


export class CollaboratorService {

    constructor(
        private readonly collabRepo: ICollaboratorRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly projAuth: ProjectAuth,
        private readonly userRepo: IUserRepository,
        private readonly constraintValidator: ConstraintValidator,
        private readonly notificationService: NotificationService,
        private readonly compValidator: CompositionValidator = new CompositionValidator(),
        
    ) {
    }

    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant, session);
        if (
            projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.accepted
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }

    async create(dto: CreateCollaboratorDto, options?: { skipValidation?: boolean }, session?: ClientSession) {
        const { applicant, project, projectTitle, userId } = dto;
        if (userId === applicant) {
            dto.isLeadPI = true;
            dto.status = CollaboratorStatus.verified;
        }
        if (!options?.skipValidation) {
            const projectDoc = await this.validateProject(project, userId ?? "", session);
            const grantId = String(projectDoc.grant);
            if (dto.isLeadPI) {
                await this.compValidator.validatePI(grantId, applicant);
            } else {
                await this.compValidator.validateCoPI(grantId, applicant);
            }
            await this.constraintValidator.validateParticipantCount(grantId, await this.collabRepo.countByProject(project, session) + 1, { skipMin: true });
        }
        try {
            const created = await this.collabRepo.create(dto, session);
            await this.projectRepo.updateTotalCollabs(project, 1, session);
            if (!dto.isLeadPI && this.notificationService) {
                await this.notificationService.notifyProjectInvitation(
                    applicant, projectTitle ?? project, dto.role, userId, session
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

    async get(options: GetCollaboratorsOptions) {
        const collaborators = await this.collabRepo.find(options);
        return collaborators;
    }


    async update(dto: UpdateCollaboratorDto) {
        const { id, data } = dto;
        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        if (collabDoc.status !== CollaboratorStatus.pending)
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_PENDING);
        return await this.collabRepo.update(id, data);
    }



    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        if (collabDoc.isLeadPI === true) throw new AppError(ERROR_CODES.USER_LEAD_PI);

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
            if (projectStatus !== ProjectStatus.draft &&
                projectStatus !== ProjectStatus.submitted &&
                projectStatus !== ProjectStatus.accepted
            ) {
                throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
            }
        }

        return await this.collabRepo.updateStatus(id,
            to
        );
    }


    async delete(dto: DeleteDto) {
        const { id, userId: applicantId } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);
        if (collabDoc.status !== CollaboratorStatus.pending) throw new AppError(ERROR_CODES.COLLABORATOR_NOT_PENDING);

        const project = String(collabDoc.project);
        const projectDoc = await this.validateProject(project, applicantId ?? "");

        const grantId = String(projectDoc.grant);
        const countCollabs = projectDoc.totalCollabs ?? 0;
        await this.constraintValidator.validateParticipantCount(grantId, countCollabs - 1);

        const deleted = this.collabRepo.delete(id);
        await this.projectRepo.updateTotalCollabs(project, -1);
        if (!collabDoc.isLeadPI && this.notificationService) {
            await this.notificationService.notifyProjectRemoval(
                String(collabDoc.applicant), projectDoc.title, collabDoc.role
            );
        }
        return deleted;
    }
}


export const COLLAB_TRANSITIONS: Record<CollaboratorStatus, CollaboratorStatus[]> = {
    [CollaboratorStatus.pending]: [CollaboratorStatus.verified],
    [CollaboratorStatus.verified]: [CollaboratorStatus.pending]
};
