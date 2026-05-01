import fs from "fs";
import path from "path";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";

import { IGrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { IProjectRepository } from "../project.repository";
import { IProjectStageRepository } from "./project.stage.repository";

import { DeleteDto } from "../../../common/dtos/delete.dto";
import { IGrantAllocation } from "../../grants/allocations/grant.allocation.model";
import { NotificationService } from "../../notifications/notification.service";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { ProjectAuth } from "../project.auth";
import {
    CreateProjectStageDTO,
    GetProjectStageDTO,
    UpdateStageDTO
} from "./project.stage.dto";
import { ProjectStageStatus } from "./project.stage.model";
import { IProjectSynchronizer } from "./project.stage.synchronizer";
import { ClientSession } from "mongoose";
import { ProjectStatus } from "../project.model";
import { ICallStageRepository } from "../../calls/stages/call.stage.repository";
import { CallStageStatus } from "../../calls/stages/call.stage.model";

export class ProjectStageService {

    constructor(
        private readonly repository: IProjectStageRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly projAuth: ProjectAuth,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly callStageRepo: ICallStageRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly synchronizer: IProjectSynchronizer,
        private readonly notificationService: NotificationService,
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


    /**
     * Create project stage (submission)
     */
    async create(dto: CreateProjectStageDTO, session?: ClientSession) {
        const { project, applicantId } = dto;

        const projectDoc = await this.validateProject(project, applicantId, session);
        const grantAllocDoc = projectDoc.grantAllocation as unknown as IGrantAllocation;

        const count = await this.repository.countByProject(project, session);
        const nextOrder = count + 1;

        const grantStage = await this.grantStageRepo.findOne(String(grantAllocDoc.grant), nextOrder, session);
        if (!grantStage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        dto.grantStage = String(grantStage._id);

        if (projectDoc.call) {
            const callStageDoc = await this.callStageRepo.findOne(
                String(projectDoc.call),
                nextOrder,
                session
            );

            if (!callStageDoc) {
                throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
            }

            if (callStageDoc.status !== CallStageStatus.active) {
                throw new AppError(ERROR_CODES.STAGE_NOT_ACTIVE);
            }
            if (callStageDoc.deadline < new Date())
                throw new AppError(ERROR_CODES.STAGE_DEADLINE_PASSED);

            dto.callStage = String(callStageDoc._id)
        }

        try {
            const created = await this.repository.create(dto, session);
            await this.synchronizer.sync(project, session);
            await this.notificationService.notifyStatusChange(
                String(projectDoc.applicant),
                projectDoc.title || "Project",
                grantStage?.name || "Stage",
                ProjectStageStatus.submitted,
                session
            ).catch(err => console.error("Notification failed", err));
            return created;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.STAGE_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    /**
     * Get project stages
     */
    async get(dto: GetProjectStageDTO) {
        return await this.repository.find(dto);
    }

    /**
     * Get by ID
     */
    async getById(id: string) {
        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        return stage;
    }

    /**
     * Update stage 
     */
    async update(dto: UpdateStageDTO) {
        throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
    }

    /**
     * Transition stage status (state machine)
     */
    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const projStageDoc = await this.repository.findById(id, true);
        if (!projStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const from = projStageDoc.status as ProjectStageStatus;
        const to = next as ProjectStageStatus;

        // Prevent race condition
        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        // Validate state transition
        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_STAGE_TRANSITIONS
        );

        if (to === ProjectStageStatus.submitted) {
            if (await this.reviewerRepo.exist({ projectStage: id })) {
                throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
            }
        }

        if (to === ProjectStageStatus.reviewed) {
            throw new AppError(ERROR_CODES.UNSUPPORTED_OPERTATION);
        }

        const updated = await this.repository.updateStatus(id, to);
        // Trigger Notification using the populated data
        const projectData = projStageDoc.project as any;
        const stageData = projStageDoc.grantStage as any;

        if (projectData?.applicant) {
            this.notificationService.notifyStatusChange(
                String(projectData.applicant),
                projectData.title || "Project",
                stageData?.name || "Stage",
                to
            ).catch(err => console.error("Notification failed", err));
        }
        return updated;
    }

    /**
     * Delete 
     */
    async delete(dto: DeleteDto) {
        const { id, userId: applicantId } = dto;

        const projectStageDoc = await this.repository.findById(id);
        if (!projectStageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        if (projectStageDoc.status !== ProjectStageStatus.submitted)
            throw new AppError(ERROR_CODES.DOC_NOT_SUBMITTED);

        const project = String(projectStageDoc.project)
        const projectDoc = await this.projectRepo.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        if (String(projectDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        // ✅ DELETE FILE FIRST
        if (projectStageDoc.documentPath) {
            const filePath = path.resolve(projectStageDoc.documentPath);

            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("File deletion failed:", err.message);
                    // optional: don't throw, just log (avoid breaking delete flow)
                }
            });
        }

        // ✅ DELETE DB RECORD
        const deleted = await this.repository.delete(id);
        await this.synchronizer.sync(project);
        return deleted;
    }
}

export const PROJECT_STAGE_TRANSITIONS: Record<ProjectStageStatus, ProjectStageStatus[]> = {
    [ProjectStageStatus.submitted]: [ProjectStageStatus.shortlisted, ProjectStageStatus.refused],
    [ProjectStageStatus.shortlisted]: [ProjectStageStatus.reviewed, ProjectStageStatus.submitted],
    [ProjectStageStatus.refused]: [ProjectStageStatus.submitted],
    [ProjectStageStatus.reviewed]: [ProjectStageStatus.accepted, ProjectStageStatus.rejected, ProjectStageStatus.shortlisted],
    [ProjectStageStatus.accepted]: [ProjectStageStatus.reviewed],
    [ProjectStageStatus.rejected]: [ProjectStageStatus.reviewed]
};
