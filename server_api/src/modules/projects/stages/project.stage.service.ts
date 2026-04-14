import fs from "fs";
import path from "path";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { TransitionHelper } from "../../../common/helpers/transition.helper";
import { TransitionRequestDto } from "../../../common/dtos/transition.dto";

import { IProjectStageRepository } from "./project.stage.repository";
import { IGrantStageRepository } from "../../grants/stages/grant.stage.repository";
import { IProjectRepository } from "../project.repository";

import { ProjectStageStatus } from "./project.stage.status";
import { PROJECT_STAGE_TRANSITIONS } from "./project.stage.state-machine";
import {
    CreateProjectStageDTO,
    GetProjectStageDTO,
    UpdateStageDTO
} from "./project.stage.dto";
import { DeleteDto } from "../../../common/dtos/delete.dto";
import { IGrantAllocationRepository } from "../../grants/allocations/grant.allocation.repository";
import { AllocationStatus } from "../../grants/allocations/grant.allocation.state-machine";
import { IProjectSynchronizer } from "./project.stage.synchronizer";
import { IReviewerRepository } from "../../reviewers/reviewer.repository";
import { NotificationService } from "../../users/notifications/notification.service";

export class ProjectStageService {

    constructor(
        private readonly repository: IProjectStageRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly grantAllocRepo: IGrantAllocationRepository,
        private readonly reviewerRepo: IReviewerRepository,
        private readonly synchronizer: IProjectSynchronizer,
        private readonly notificationService: NotificationService,
    ) {
    }

    /**
     * Create project stage (submission)
     */
    async create(dto: CreateProjectStageDTO) {
        const { project, grantStage, applicantId } = dto;

        const projectDoc = await this.projectRepo.findById(project);
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        // Authorization: only applicant can submit
        if (String(projectDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        const grantAllocDoc = await this.grantAllocRepo.findById(String(projectDoc.grantAllocation));
        if (!grantAllocDoc) throw new AppError(ERROR_CODES.ALLOCATION_NOT_FOUND);
        if (grantAllocDoc.status !== AllocationStatus.active) throw new AppError(ERROR_CODES.ALLOCATION_NOT_ACTIVE);

        const projectStages = await this.repository.find({ project });
        const nextOrder = projectStages.length + 1;
        if (nextOrder > 1) {
            const hasNotAccepted = projectStages.some(ps => ps.status !== ProjectStageStatus.accepted);
            if (hasNotAccepted)
                throw new AppError(ERROR_CODES.PROJECT_STAGE_NOT_ACCEPTED);
        }

        const grantStages = await this.grantStageRepo.find({ grant: String(grantAllocDoc.grant), order: nextOrder });
        if (grantStages.length == 0) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
        //|| grantStages.length < 1 ERROR
        const nextGrantStageDoc = grantStages[0];
        dto.grantStage = String(nextGrantStageDoc._id);
        try {
            const created = await this.repository.create(dto);
            await this.synchronizer.sync(project);
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

        const stageDoc = await this.repository.findById(id, true);
        if (!stageDoc) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const from = stageDoc.status as ProjectStageStatus;
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

        const updated = await this.repository.updateStatus(id, to);
        // Trigger Notification using the populated data
        const projectData = stageDoc.project as any;
        const stageData = stageDoc.grantStage as any;

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
        const { id, applicantId } = dto;

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