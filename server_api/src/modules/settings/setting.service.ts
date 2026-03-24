import { ISettingRepository } from "./setting.repository";
import { SettingKey, ISetting } from "./setting.model";
import { UpdateSettingDto } from "./setting.dto";
import { AppError } from '../../common/errors/app.error';
import { ERROR_CODES } from '../../common/errors/error.codes';

export class SettingService {
    

    constructor(private repository: ISettingRepository) {
       
    }

    /**
     * Retrieves all settings for the admin dashboard.
     */
    async getAllSettings(): Promise<ISetting[]> {
        return await this.repository.findAll();
    }

    /**
     * Retrieves a specific setting value by its Enum key.
     */
    async getSettingValue<T>(key: SettingKey, defaultValue: T): Promise<T> {
        const setting = await this.repository.findByKey(key);
        return setting ? (setting.value as T) : defaultValue;
    }

    async update(key: SettingKey, dto: UpdateSettingDto): Promise<ISetting | null> {
        switch (key) {
            case SettingKey.MAX_FILE_UPLOAD_SIZE_MB:
                if (dto.value <= 0 || dto.value > 100) { // Limit to 100MB for server safety
                    throw new AppError(ERROR_CODES.SETTING_FILE_SIZE_OUT_OF_RANGE);
                }
                break;
        }
        const setting = await this.repository.update(key, dto);
        if (!setting) {
            throw new AppError(ERROR_CODES.SETTING_NOT_FOUND);
        }
        return setting;
    }
}