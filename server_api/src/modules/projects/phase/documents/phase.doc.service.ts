import { randomUUID } from "crypto";
import { AppError } from "../../../../common/errors/app.error";
import { ERROR_CODES } from "../../../../common/errors/error.codes";
import { FileStorageService } from "../../../../common/services/file-storage.service";
import { PhaseStatus } from "../phase.model";
import { IPhaseRepository } from "../phase.repository";
import { CreatePhaseDocDTO, FilterPhaseDocDTO } from "./phase.doc.dto";
import { IPhaseDocumentRepository } from "./phase.doc.repository";
import path from "path";

export class PhaseDocumentService {

    constructor(
        private readonly repository: IPhaseDocumentRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly fileStorage: FileStorageService
        //projectAuth
    ) { }

    async create(
        dto: CreatePhaseDocDTO,
        file: Express.Multer.File
    ) {
        let savedPath: string | null = null;

        try {
            const phase = await this.phaseRepo.findById(dto.phase);
            if (!phase) throw new AppError(ERROR_CODES.PHASE_NOT_FOUND);
            if (phase.status !== PhaseStatus.active)
                throw new AppError(ERROR_CODES.PHASE_NOT_ACTIVE);

            // Adjust `phase.project` to however your Phase model stores the project id
            const projectId = String(phase.project);
            const phaseId = String(dto.phase);

            // Unique, safe filename (never trust the original name for the path)
            const ext = path.extname(file.originalname).toLowerCase();
            const filename = `${randomUUID()}${ext}`;

            // -> uploads/projects/<projectId>/phases/<phaseId>/<uuid>.pdf
            savedPath = await this.fileStorage.move(
                file.path,
                `projects/${projectId}/phases/${phaseId}`,
                filename
            );

            return await this.repository.create({
                ...dto,
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

    async get(options: FilterPhaseDocDTO) {
        const items = await this.repository.find(options);
        return items;
    }

    async delete(id: string, userId: string) {
        const phaseDocDoc = await this.repository.delete(id);
        if (!phaseDocDoc) throw new AppError(ERROR_CODES.PHASE_DOCUMENT_NOT_FOUND);
        return phaseDocDoc;
    }
}
