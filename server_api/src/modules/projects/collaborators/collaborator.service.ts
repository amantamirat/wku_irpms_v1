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
import { COLLAB_TRANSITIONS } from "./collaborator.state-machine";
import { CollaboratorStatus } from "./collaborator.status";
import { ClientSession } from "mongoose";
import { ProjectAuth } from "../project.auth";
import { NotificationService } from "../../notifications/notification.service";


export class CollaboratorService {

    constructor(
        private readonly collabRepo: ICollaboratorRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly projAuth: ProjectAuth,
        private readonly applicantRepo: IUserRepository,
        private readonly validator: ConstraintValidator,
        private readonly notificationService: NotificationService,
    ) {
    }

    async validateProject(project: string, applicant: string, session?: ClientSession) {
        const projectDoc = await this.projAuth.authProject(project, applicant, session);
        if (
            projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation
        ) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }
        return projectDoc;
    }

    async create(dto: CreateCollaboratorDto, options?: { skipValidation?: boolean }, session?: ClientSession) {
        const { applicant, project, projectTitle, userId } = dto;
        // ✅ Skip entire validation if requested
        if (!options?.skipValidation) {
            const projectDoc = await this.validateProject(project, applicant, session);
            const grantId = (projectDoc.grantAllocation as any).grant;

            const appDoc = await this.applicantRepo.findById(applicant);
            if (!appDoc) throw new Error(ERROR_CODES.USER_NOT_FOUND);
            const countCollabs = await this.collabRepo.countByProject(project, session);

            await this.validator.validateParticipants(grantId, countCollabs + 1, {
                skipMin: true
            });
        }

        if (userId === applicant) {
            dto.isLeadPI = true;
            dto.status = CollaboratorStatus.verified;
        }
        try {
            const created = await this.collabRepo.create(dto, session);
            if (!dto.isLeadPI) {
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
        if (!collabDoc) {
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_FOUND);
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
            const projectDoc = await this.projectRepo.findById(String(collabDoc.project));
            if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);
            const projectStatus = projectDoc.status;

            if (projectStatus !== ProjectStatus.draft &&
                projectStatus !== ProjectStatus.submitted &&
                projectStatus !== ProjectStatus.accepted &&
                projectStatus !== ProjectStatus.negotiation
            ) {
                throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
            }
        }

        return await this.collabRepo.updateStatus(id,
            to
        );
    }


    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const collabDoc = await this.collabRepo.findById(id);
        if (!collabDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);

        if (collabDoc.status !== CollaboratorStatus.pending)
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_PENDING);

        const project = String(collabDoc.project);
        const projectDoc = await this.validateProject(project, applicantId ?? "");
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        const deleted = this.collabRepo.delete(id);
        if (!collabDoc.isLeadPI) {
            await this.notificationService.notifyProjectRemoval(
                String(collabDoc.applicant), projectDoc.title, collabDoc.role
            );
        }
        return deleted;
    }
}