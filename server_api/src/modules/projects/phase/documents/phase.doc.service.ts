import { randomUUID } from "crypto";
import path from "path";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { FileStorageService } from "../../../../common/services/file-storage.service";
import { PhaseStatus } from "../phase.model";
import { IPhaseRepository } from "../phase.repository";
import { CreatePhaseDocDTO, FilterPhaseDocDTO } from "./phase.doc.dto";
import { IPhaseDocumentRepository } from "./phase.doc.repository";
import { ProjectDocumentStatus } from "./phase.doc.model";
import { TransitionHelper } from "../../../../common/helpers/transition.helper";
import { TransitionRequestDto } from "../../../../common/dtos/transition.dto";
import { IPhaseActivityRepository } from "../../activities/phase-activity.repository";
import { PhaseActivityStatus } from "../../activities/phase-activity.model";
import { ProjectAuth } from "../../project.auth";
import { PERMISSIONS } from "../../../../common/constants/permissions";
import { FilterOptions } from "../../../../common/dtos/filter.dto";

export class PhaseDocumentService {

    constructor(
        private readonly repository: IPhaseDocumentRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly activityRepo: IPhaseActivityRepository,
        private readonly projectAuth: ProjectAuth,
        private readonly fileStorage: FileStorageService
    ) { }

    async create(
        dto: CreatePhaseDocDTO,
        file: Express.Multer.File,
        userId: string,
    ) {

        let savedPath: string | null = null;

        try {

            const { projectDoc, isLeadPI } = await this.projectAuth.auth(dto.project, userId, PERMISSIONS.PHASE_DOCUMENT.CREATE);

            if (isLeadPI) {

            }

            // Treat empty strings (e.g. from multipart forms) as "not provided"
            const phaseId = dto.phase || undefined;
            const activityId = dto.activity || undefined;
            // Only validate the phase when one is provided
            if (phaseId) {
                const phase = await this.phaseRepo.findById(phaseId);
                if (!phase) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
                if (phase.status !== PhaseStatus.active)
                    throw new AppError(ERROR_CODES.PHASE_NOT_ACTIVE);
                // The phase must belong to the project the document is for
                // (adjust `phase.project` to however your Phase model stores it)
                if (String(phase.project) !== String(dto.project))
                    throw new AppError(ERROR_CODES.PHASE_PROJECT_MISMATCH);
            }

            // Unique, safe filename (never trust the original name for the path)
            const ext = path.extname(file.originalname).toLowerCase();
            const filename = `${randomUUID()}${ext}`;

            // -> uploads/projects/<projectId>/documents/<uuid>.pdf
            // The folder no longer depends on the phase, since it's optional
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
            // Covers failures before the move (phase not found, not active, etc.)
            await this.fileStorage.discardTemp(file.path);
            throw error;
        }
    }

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

        const {
            id,
            next,
            current,
            reason
        } = dto;

        const docDoc =
            await this.repository.findById(id);

        if (!docDoc)
            throw new AppError(
                ERROR_CODES.PHASE_DOCUMENT_NOT_FOUND
            );

        const from =
            docDoc.status as ProjectDocumentStatus;

        const to =
            next as ProjectDocumentStatus;

        if (current && current !== from) {
            throw new AppError(
                ERROR_CODES.STATE_OUT_OF_SYNC
            );
        }

        TransitionHelper.validateTransition(
            from,
            to,
            PROJECT_DOCUMENT_STATUS_TRANSITIONS
        );

        return await this.repository.updateStatus(
            id,
            to,
            userId,
            reason
        );
    }



    async delete(id: string, userId: string) {
        const proDocDoc = await this.repository.findById(id);

        if (!proDocDoc) {
            throw new AppError(ERROR_CODES.PHASE_DOCUMENT_NOT_FOUND);
        }

        if (proDocDoc.status !== ProjectDocumentStatus.pending) {
            throw new AppError(ERROR_CODES.PHASE_DOCUMENT_NOT_PENDING);
        }

        // Only check the phase if the document belongs to one
        if (proDocDoc.phase) {
            const phase = await this.phaseRepo.findById(
                String(proDocDoc.phase)
            );
            if (!phase) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            if (phase.status === PhaseStatus.completed)
                throw new AppError(ERROR_CODES.PHASE_ALREADY_COMPLETED);
        }

        if (proDocDoc.activity) {
            const activityDoc = await this.activityRepo.findById(
                proDocDoc.activity.toString()
            );
            if (!activityDoc) throw new AppError(ERROR_CODES.PHASE_ACTIVITY_NOT_FOUND);
            if (activityDoc.status === PhaseActivityStatus.completed)
                throw new AppError(ERROR_CODES.PHASE_ALREADY_COMPLETED);
        }

        if (proDocDoc.documentPath) {
            await this.fileStorage.delete(proDocDoc.documentPath);
        }

        await this.repository.delete(id);

        return proDocDoc;
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