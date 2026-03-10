import mongoose from "mongoose";
import { Setting, ISetting, SettingKey } from "./setting.model";
import { UpdateSettingDto } from "./setting.dto"; // Assuming you named it this

export interface ISettingRepository {
    create(
        key: SettingKey,
        value: any,
        type: "string" | "number" | "boolean" | "json",
        description?: string
    ): Promise<ISetting>
    findByKey(key: SettingKey): Promise<ISetting | null>;
    findAll(): Promise<ISetting[]>;
    update(key: SettingKey, data: UpdateSettingDto): Promise<ISetting | null>;
}

export class SettingRepository implements ISettingRepository {
    /**
     * Creates a new setting entry.
     * Usually handled by your seed script, but useful for manual additions.
     */
    async create(
        key: SettingKey, value: any, type: "string" | "number" | "boolean" | "json",
        description?: string
    ): Promise<ISetting> {
        return Setting.create({
            key,
            value,
            type,
            description
        });
    }

    /**
     * Find a specific setting by its Enum key.
     * This is the most used method for app configuration.
     */
    async findByKey(key: SettingKey): Promise<ISetting | null> {
        return Setting.findOne({ key })
            .lean<ISetting>()
            .exec();
    }

    /**
     * Get all settings (useful for an Admin Dashboard list)
     */
    async findAll(): Promise<ISetting[]> {
        return Setting.find()
            .sort({ key: 1 }) // Sort alphabetically for the UI
            .lean<ISetting[]>()
            .exec();
    }

    /**
     * Update a setting's value or description using its key.
     */
    async update(key: SettingKey, dtoData: UpdateSettingDto): Promise<ISetting | null> {
        const updateData: Partial<ISetting> = {};

        if (dtoData.value !== undefined) {
            updateData.value = dtoData.value;
        }

        if (dtoData.description !== undefined) {
            updateData.description = dtoData.description;
        }

        return Setting.findOneAndUpdate(
            { key },
            { $set: updateData },
            { new: true, runValidators: true }
        ).exec();
    }
}