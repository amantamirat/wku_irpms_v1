import { DeleteDto } from "../../../common/dtos/delete.dto";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { SettingKey } from "../../settings/setting.model";
import { SettingService } from "../../settings/setting.service";
import { themeLevelIndex } from "../thematic.enum";
import { IThematicRepository } from "../thematic.repository";
import { ThematicStatus } from "../thematic.state-machine";
import { CreateThemeDTO, GetThemeDTO, IThemeImportDTO, UpdateThemeDTO } from "./theme.dto";
import { IThemeRepository } from "./theme.repository";
import mongoose from 'mongoose';
import fs from "fs";

export class ThemeService {

    constructor(
        private readonly repository: IThemeRepository,
        private readonly thematicRepo: IThematicRepository,
        private readonly settingService: SettingService
    ) { }

    async create(dto: CreateThemeDTO) {
        const { parent } = dto;
        dto.level = 0;
        if (parent) {
            const parentDoc = await this.repository.findById(parent);
            if (!parentDoc) throw new Error(ERROR_CODES.THEME_NOT_FOUND);
            dto.level = parentDoc.level + 1;
            dto.thematicArea = String(parentDoc.thematicArea);
        }
        const thematicDoc = await this.thematicRepo.findById(dto.thematicArea);
        if (!thematicDoc) throw new Error(ERROR_CODES.THEMATIC_NOT_FOUND);
        if (thematicDoc.status !== ThematicStatus.draft) throw new Error(ERROR_CODES.THEMATIC_NOT_DRAFT);
        const levelIndex = themeLevelIndex[thematicDoc.level];
        if (levelIndex < dto.level) {
            throw new Error(ERROR_CODES.INVALID_THEME_LEVEL);
        }
        try {
            return await this.repository.create(dto);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async getThemes(filters: GetThemeDTO) {
        return await this.repository.find(filters);
    }

    async update(dto: UpdateThemeDTO) {
        const { id, data } = dto;
        try {
            const themeDoc = await this.repository.update(id, data);
            if (!themeDoc) throw new Error(ERROR_CODES.THEME_NOT_FOUND);
            return themeDoc;
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS);
            }
            throw err;
        }
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;

        const themeDoc = await this.repository.findById(id);
        if (!themeDoc) throw new AppError(ERROR_CODES.THEME_NOT_FOUND);

        const thematicDoc = await this.thematicRepo.findById(String(themeDoc.thematicArea));
        if (!thematicDoc) throw new AppError(ERROR_CODES.THEMATIC_NOT_FOUND);

        if (thematicDoc.status !== ThematicStatus.draft) throw new AppError(ERROR_CODES.THEMATIC_NOT_DRAFT);

        const deleted = await this.repository.delete(id);
        if (deleted) await this.repository.deleteMany({ theme: id });
        return deleted;
    }

    async importFromFile(file: Express.Multer.File, thematicAreaId: string) {
        // 1. Get Dynamic Settings
        const maxSizeMB = await this.settingService.getSettingValue<number>(
            SettingKey.MAX_FILE_UPLOAD_SIZE_MB,
            5
        );

        // 2. Validate Size
        if (file.size > maxSizeMB * 1024 * 1024) {
            // Cleanup before throwing
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            throw new AppError(ERROR_CODES.FILE_TOO_LARGE);
        }

        try {
            // 3. Process File
            const fileContent = fs.readFileSync(file.path, 'utf-8');
            const themeData = JSON.parse(fileContent);

            if (!Array.isArray(themeData)) {
                throw new AppError(ERROR_CODES.INVALID_FILE_FORMAT);
            }

            // 4. Call your existing recursive logic
            // Ensure you pass the thematicAreaId and the parsed array
            return await this.importThemes(thematicAreaId, themeData);

        } catch (error) {
            // Re-throw or handle JSON parse errors specifically
            if (error instanceof SyntaxError) {
                throw new AppError(ERROR_CODES.INVALID_JSON_STRUCTURE);
            }
            throw error;
        } finally {
            // 5. Absolute Cleanup: This runs whether the try succeeded or caught an error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
    }

    async importThemes(thematicId: string, data: IThemeImportDTO[]) {
        const thematic = await this.thematicRepo.findById(thematicId);
        if (!thematic) throw new Error(ERROR_CODES.THEMATIC_NOT_FOUND);
        if (thematic.status !== ThematicStatus.draft) throw new Error(ERROR_CODES.THEMATIC_NOT_DRAFT);

        const maxLevel = themeLevelIndex[thematic.level];

        // Start a Database Session
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            for (const item of data) {
                await this.createRecursive(
                    item,
                    thematicId,
                    undefined,
                    0,
                    maxLevel,
                    session // Pass the session here
                );
            }

            await session.commitTransaction();
            return "Import completed successfully";
        } catch (error) {
            // If anything fails, undo every insert made during this function
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    private async createRecursive(
        item: any,
        thematicAreaId: string,
        parent: string | undefined,
        level: number,
        maxLevel: number,
        session: mongoose.ClientSession
    ) {
        if (level > maxLevel) return;

        let theme;

        try {
            // Pass the session as the second argument
            theme = await this.repository.create({
                title: item.title,
                priority: item.priority,
                thematicArea: thematicAreaId,
                parent,
                level
            }, session);
        } catch (err: any) {
            if (err?.code === 11000) {
                throw new AppError(ERROR_CODES.THEME_ALREADY_EXISTS,
                    `Theme "${item.title} - level ${level}" already exists in this thematic`
                );
            }
            throw err;
        }

        if (!item.children || !Array.isArray(item.children)) return;

        for (const child of item.children) {
            await this.createRecursive(
                child,
                thematicAreaId,
                String(theme._id), // theme is now a single object again
                level + 1,
                maxLevel,
                session
            );
        }
    }
}
