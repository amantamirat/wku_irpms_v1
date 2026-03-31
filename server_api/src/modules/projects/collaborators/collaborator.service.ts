// collaborator.service.ts
import { SYSTEM } from "../../../common/constants/system.constant";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { IApplicantRepository } from "../../applicants/applicant.repository";
import { IProjectRepository } from "../project.repository";
import {
    CreateCollaboratorDto,
    GetCollaboratorsOptions
} from "./collaborator.dto";
import { ICollaboratorRepository } from "./collaborator.repository";

import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { ProjectStatus } from "../project.state-machine";
import { COLLAB_TRANSITIONS } from "./collaborator.state-machine";
import { CollaboratorStatus } from "./collaborator.status";
import { NotificationService } from "../../users/notifications/notification.service";


export class CollaboratorService {

    constructor(
        private readonly repository: ICollaboratorRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly applicantRepo: IApplicantRepository,
        private readonly notificationService: NotificationService,
    ) {
    }

    async create(dto: CreateCollaboratorDto) {
        const { applicant, project, userId } = dto;

        const projectDoc = await this.projectRepo.findById(project);
        if (!projectDoc) throw new Error(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== userId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        if (projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        const appDoc = await this.applicantRepo.findById(applicant);
        if (!appDoc) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);

        if (String(appDoc._id) === String(projectDoc.applicant)) {
            dto.isLeadPI = true;
            dto.status = CollaboratorStatus.verified;
        }
        try {
            const created = await this.repository.create(dto);
            // Trigger Notification: "You have been added to a project"
            // We don't notify the Lead PI of their own action
            if (!dto.isLeadPI) {
                await this.notificationService.notifyProjectInvitation(
                    applicant, projectDoc.title
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
        const collaborators = await this.repository.find(options);
        return collaborators;
    }

    /*
    async updateCollaborator(dto: UpdateCollaboratorDto) {
        const updated = await this.repository.update(dto.id, dto.data);
        return updated;
    }
    */


    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const collabDoc = await this.repository.findById(id);
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

        return await this.repository.update(id, {
            status: to
        });
    }



    async delete(dto: DeleteDto) {
        const { id, applicantId } = dto;

        const collaboratorDoc = await this.repository.findById(id);
        if (!collaboratorDoc) throw new Error(ERROR_CODES.COLLABORATOR_NOT_FOUND);

        if (collaboratorDoc.status !== CollaboratorStatus.pending)
            throw new AppError(ERROR_CODES.COLLABORATOR_NOT_PENDING);

        const projectDoc = await this.projectRepo.findById(String(collaboratorDoc.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId && SYSTEM.SU_USER !== applicantId)
            throw new AppError(ERROR_CODES.USER_NOT_LEAD_PI);

        if (projectDoc.status !== ProjectStatus.draft &&
            projectDoc.status !== ProjectStatus.negotiation) {
            throw new AppError(ERROR_CODES.INVALID_PROJECT_STATUS);
        }

        return await this.repository.delete(id);
    }
}