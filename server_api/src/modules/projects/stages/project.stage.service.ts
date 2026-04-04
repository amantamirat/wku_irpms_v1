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
import { IProjectSynchronizer, ProjectStageSynchronizer } from "./project.stage.synchronizer";

export class ProjectStageService {

    constructor(
        private readonly repository: IProjectStageRepository,
        private readonly projectRepo: IProjectRepository,
        private readonly grantStageRepo: IGrantStageRepository,
        private readonly grantAllocRepo: IGrantAllocationRepository,
        private readonly synchronizer: IProjectSynchronizer,
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

        const grantStages = await this.grantStageRepo.find({ grant: String(grantAllocDoc.grant), order: nextOrder });
        if (grantStages.length == 0 || grantStages.length < 1) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);
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
     * Update stage (score or status)
     */
    async update(dto: UpdateStageDTO) {
        const { id, data, applicantId } = dto;

        const stage = await this.repository.findById(id);
        if (!stage) throw new AppError(ERROR_CODES.STAGE_NOT_FOUND);

        const projectDoc = await this.projectRepo.findById(String(stage.project));
        if (!projectDoc) throw new AppError(ERROR_CODES.PROJECT_NOT_FOUND);

        // Only applicant can update BEFORE evaluation
        if (String(projectDoc.applicant) !== applicantId)
            throw new AppError(ERROR_CODES.UNAUTHORIZED);

        if (stage.status !== ProjectStageStatus.submitted) {
            // throw new AppError(ERROR_CODES.INVALID_STAGE_UPDATE);
        }

        return await this.repository.update(id, data);
    }

    /**
     * Transition stage status (state machine)
     */
    async transitionState(dto: TransitionRequestDto) {
        const { id, current, next } = dto;

        const stageDoc = await this.repository.findById(id);
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

        return await this.repository.updateStatus(id, to);
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