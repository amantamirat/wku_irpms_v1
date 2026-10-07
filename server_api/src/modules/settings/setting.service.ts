import { ISettingRepository } from "./setting.repository";
import { SettingKey, ISetting } from "./setting.model";
import { UpdateSettingDto } from "./setting.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

export class SettingService {
    private static readonly ALLOWED_MIME_TYPES = new Set([
        // Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        // Spreadsheets
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        // Presentations
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        // Images
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",

        // Text
        "text/plain",
        "text/csv",

        // Handlebars templates
        "text/x-handlebars-template",
    ]);

    constructor(private readonly repository: ISettingRepository) { }

    /**
     * Retrieves all settings for the admin dashboard.
     */
    async getAllSettings(): Promise<ISetting[]> {
        return await this.repository.findAll();
    }

    /**
     * Retrieves a specific setting value by its Enum key.
     */
    async getSettingValue<T>(
        key: SettingKey,
        defaultValue: T
    ): Promise<T> {
        const setting = await this.repository.findByKey(key);

        return setting
            ? (setting.value as T)
            : defaultValue;
    }

    async update(
        key: SettingKey,
        dto: UpdateSettingDto
    ): Promise<ISetting | null> {

        switch (key) {
            case SettingKey.MAX_FILE_UPLOAD_SIZE_MB:
                if (
                    typeof dto.value !== "number" ||
                    dto.value <= 0 ||
                    dto.value > 100
                ) {
                    throw new AppError(
                        ERROR_CODES.SETTING_FILE_SIZE_OUT_OF_RANGE
                    );
                }
                break;

            case SettingKey.ALLOWED_FILE_TYPES:
                this.validateAllowedFileTypes(dto.value);
                break;
        }

        const setting = await this.repository.update(key, dto);

        if (!setting) {
            throw new AppError(ERROR_CODES.SETTING_NOT_FOUND);
        }

        return setting;
    }

    private validateAllowedFileTypes(value: unknown): void {
        if (!Array.isArray(value)) {
            throw new AppError(
                ERROR_CODES.SETTING_ALLOWED_FILE_TYPES_INVALID
            );
        }

        if (value.length === 0) {
            throw new AppError(
                ERROR_CODES.SETTING_ALLOWED_FILE_TYPES_INVALID
            );
        }

        const invalidTypes = value.filter(
            (type): type is unknown =>
                typeof type !== "string" ||
                !SettingService.ALLOWED_MIME_TYPES.has(type)
        );

        if (invalidTypes.length > 0) {
            throw new AppError(
                ERROR_CODES.SETTING_ALLOWED_FILE_TYPES_INVALID
            );
        }

        const duplicates = value.filter(
            (type, index) => value.indexOf(type) !== index
        );

        if (duplicates.length > 0) {
            throw new AppError(
                ERROR_CODES.SETTING_ALLOWED_FILE_TYPES_INVALID
            );
        }
    }
}