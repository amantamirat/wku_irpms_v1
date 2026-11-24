import { randomUUID } from "crypto";
import path from "path";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { FileStorageService } from "../../../../common/services/file-storage.service";
import { IPhaseRepository } from "../phase.repository";
import { CreatePhaseDocDTO, FilterPhaseDocDTO } from "./phase.doc.dto";
import { IPhaseDocumentRepository } from "./phase.doc.repository";
import {
    ProjectDocumentStatus,
    DocumentScope,
    DOCUMENT_TYPE_SCOPE
} from "./phase.doc.model";
import { TransitionHelper } from "../../../../common/helpers/transition.helper";
import { TransitionRequestDto } from "../../../../common/dtos/transition.dto";
import { IPhaseActivityRepository } from "../../activities/phase-activity.repository";
import { ProjectAuth } from "../../project.auth";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { FilterOptions } from "../../../../common/dtos/filter.dto";
import { PROJECT_EDITABLE_STATES } from "../../project.service";

export class PhaseDocumentService {

    constructor(
        private readonly repository: IPhaseDocumentRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly projectAuth: ProjectAuth,
        private readonly fileStorage: FileStorageService
    ) { }

    // ---------------------------------------------------
    // CREATE
    // ---------------------------------------------------

    async create(
        dto: CreatePhaseDocDTO,
        file: Express.Multer.File,
        userId: string,
    ) {
        let savedPath: string | null = null;

        try {
            const { projectDoc } = await this.projectAuth.auth(
                dto.project,
                userId,
                PERMISSIONS.PHASE_DOCUMENT.CREATE
            );

            if (!PROJECT_EDITABLE_STATES.includes(projectDoc.status)) {
                throw new AppError(ERROR_CODES.PROJECT_NOT_EDITABLE);
            }

            // Validates by document type and returns the final phase/activity to store
            const { phaseId, activityId } = await this.resolveScope(dto);

            // Unique, safe filename (never trust the original name for the path)
            const ext = path.extname(file.originalname).toLowerCase();
            const filename = `${randomUUID()}${ext}`;

            // -> uploads/projects/<projectId>/documents/<uuid>.pdf
            savedPath = await this.fileStorage.move(
                file.path,
                `projects/${dto.project}/documents`,
                filename
            );

            return await this.repository.create({
                ...dto,
                phase: phaseId,
                activity: activityId,
                documentPath: savedPath
            });
        } catch (error) {
            if (savedPath) {
                // File was moved but the DB insert failed, so remove the moved file
                await this.fileStorage.delete(savedPath);
            }
            // Covers failures before the move (validation errors, etc.)
            await this.fileStorage.discardTemp(file.path);
            throw error;
        }
    }

    // ---------------------------------------------------
    // READ
    // ---------------------------------------------------

    async get(filter: FilterPhaseDocDTO, options?: FilterOptions) {
        return this.repository.find(filter, options);
    }

    // ---------------------------------------------------
    // TRANSITION
    // ---------------------------------------------------

    async transitionState(
        dto: TransitionRequestDto,
        userId: string
    ) {
        const { id, next, current, reason } = dto;

        const docDoc = await this.repository.findById(id);

        if (!docDoc) {
            throw new AppError(ERROR_CODES.PHASE_DOCUMENT_NOT_FOUND);
        }

        const from = docDoc.status as ProjectDocumentStatus;
        const to = next as ProjectDocumentStatus;

        if (current && current !== from) {
            throw new AppError(ERROR_CODES.STATE_OUT_OF_SYNC);
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_DOCUMENT_STATUS_TRANSITIONS
        );

        return await this.repository.updateStatus(id, to, userId, reason);
    }

    // ---------------------------------------------------
    // DELETE
    // ---------------------------------------------------

    async delete(id: string, userId: string) {
        const proDocDoc = await this.repository.findById(id);

        if (!proDocDoc) {
            throw new AppError(ERROR_CODES.PHASE_DOCUMENT_NOT_FOUND);
        }

        if (proDocDoc.status !== ProjectDocumentStatus.pending) {
            throw new AppError(ERROR_CODES.PHASE_DOCUMENT_NOT_PENDING);
        }

        if (proDocDoc.documentPath) {
            await this.fileStorage.delete(proDocDoc.documentPath);
        }

        await this.repository.delete(id);

        return proDocDoc;
    }

    // ---------------------------------------------------
    // SCOPE VALIDATION (private helpers)
    // ---------------------------------------------------

    /**
     * Applies the scope rule for the document type.
     *  - project  : phase and activity are ignored (set to undefined)
     *  - phase    : phase required, activity ignored
     *  - activity : activity required, phase is derived from the activity
     */
    private async resolveScope(dto: CreatePhaseDocDTO): Promise<{
        phaseId?: string;
        activityId?: string;
    }> {
        // Treat empty strings (multipart forms) as "not provided"
        const phaseInput = dto.phase || undefined;
        const activityInput = dto.activity || undefined;

        const scope = DOCUMENT_TYPE_SCOPE[dto.type];
        if (!scope) {
            throw new AppError(ERROR_CODES.INVALID_DOCUMENT_TYPE);
        }

        switch (scope) {
            case DocumentScope.project:
                return { phaseId: undefined, activityId: undefined };

            case DocumentScope.phase: {
                if (!phaseInput) {
                    throw new AppError(ERROR_CODES.PHASE_REQUIRED);
                }
                await this.assertPhaseInProject(phaseInput, dto.project);
                return { phaseId: phaseInput, activityId: undefined };
            }

            case DocumentScope.activity: {
                if (!activityInput) {
                    throw new AppError(ERROR_CODES.ACTIVITY_REQUIRED);
                }

                const activity = await this.activityRepo.findById(activityInput);
                if (!activity) {
                    throw new AppError(ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND);
                }

                // The activity decides the phase, so the two can never disagree
                const activityPhaseId = String(activity.phase);

                if (phaseInput && phaseInput !== activityPhaseId) {
                    throw new AppError(ERROR_CODES.ACTIVITY_PHASE_MISMATCH);
                }

                await this.assertPhaseInProject(activityPhaseId, dto.project);

                return { phaseId: activityPhaseId, activityId: activityInput };
            }
        }
    }

    private async assertPhaseInProject(phaseId: string, projectId: string) {
        const phase = await this.phaseRepo.findById(phaseId);
        if (!phase) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
        if (String(phase.project) !== String(projectId)) {
            throw new AppError(ERROR_CODES.PHASE_PROJECT_MISMATCH);
        }
    }
}

export const PROJECT_DOCUMENT_STATUS_TRANSITIONS: Record<ProjectDocumentStatus, ProjectDocumentStatus[]> = {
    [ProjectDocumentStatus.pending]: [
        ProjectDocumentStatus.approved,
        ProjectDocumentStatus.refused
    ],

    [ProjectDocumentStatus.approved]: [
        ProjectDocumentStatus.pending
    ],

    [ProjectDocumentStatus.refused]: [
        ProjectDocumentStatus.pending
    ]
};