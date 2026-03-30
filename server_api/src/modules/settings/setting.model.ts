import { Schema, model, Document } from "mongoose";

export enum SettingKey {
    TOKEN_EXPIRY_HOURS = "token_expiry_hours",
    MAX_LOGIN_ATTEMPTS = "max_login_attempts",
    ACCOUNT_LOCK_MIN = "account_lock_min",
    MAX_FILE_UPLOAD_SIZE_MB = "max_file_upload_size_mb",
    ALLOWED_FILE_TYPES = "allowed_file_types", // e.g., ["image/png", "application/pdf"]
    NOTIFICATION_EXPIRY_HOURS = "notification_expiry_hours",
    MAINTENANCE_MODE = "maintenance_mode",
}

export interface ISetting extends Document {
    key: SettingKey;
    value: any;
    type: "string" | "number" | "boolean" | "json";
    description?: string;
}

const SettingSchema = new Schema<ISetting>({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: Object.values(SettingKey) // Validates against the Enum values
    },
    value: { type: Schema.Types.Mixed, required: true },
    type: {
        type: String,
        enum: ["string", "number", "boolean", "json"],
        required: true
    },
    description: { type: String },
}, { timestamps: true });

export const Setting = model<ISetting>("Setting", SettingSchema);