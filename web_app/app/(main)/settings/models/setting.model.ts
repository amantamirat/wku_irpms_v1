export enum SettingKey {
    TOKEN_EXPIRY_HOURS = "token_expiry_hours",
    MAX_LOGIN_ATTEMPTS = "max_login_attempts",
    ACCOUNT_LOCK_MIN = "account_lock_min",
    MAX_FILE_UPLOAD_SIZE_MB = "max_file_upload_size_mb",
    ALLOWED_FILE_TYPES = "allowed_file_types", // e.g., ["image/png", "application/pdf"]
    MAINTENANCE_MODE = "maintenance_mode"
}

export type Setting = {
    _id?: string;
    key: SettingKey;
    value: any;
    type: "string" | "number" | "boolean" | "json";
    description?: string;
    updatedAt?: string;
};

/**
 * Validates the setting before sending to the API.
 * Ensures the value matches the required type.
 */
export const validateSetting = (setting: Setting): { valid: boolean; message?: string } => {
    if (setting.value === undefined || setting.value === null || setting.value === "") {
        return { valid: false, message: "Setting value is required." };
    }

    // Type-specific validation
    switch (setting.type) {
        case "number":
            if (isNaN(Number(setting.value))) {
                return { valid: false, message: "Value must be a valid number." };
            }
            break;
        case "boolean":
            if (typeof setting.value !== "boolean") {
                return { valid: false, message: "Value must be true or false." };
            }
            break;
        case "string":
            if (typeof setting.value !== "string") {
                return { valid: false, message: "Value must be a string." };
            }
            break;
        case "json":
            if (!Array.isArray(setting.value) && typeof setting.value !== "object") {
                return { valid: false, message: "Value must be a valid JSON object or array." };
            }
            break;
    }

    return { valid: true };
};

/**
 * Prepares the setting for the API.
 * Ensures numbers are sent as numbers, not strings from input fields.
 */
export function sanitizeSetting(setting: Partial<Setting>): Partial<Setting> {
    const sanitized = { ...setting };

    if (sanitized.type === "number" && sanitized.value !== undefined) {
        sanitized.value = Number(sanitized.value);
    }

    // Remove internal database fields if sending an update
    delete sanitized._id;
    delete sanitized.updatedAt;

    return sanitized;
}


export const FILE_TYPE_OPTIONS = [
    { name: 'PDF Document (.pdf)', value: 'application/pdf' },
    { name: 'Word Document (.docx)', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    { name: 'Word Old (.doc)', value: 'application/msword' },
    { name: 'Excel Sheet (.xlsx)', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { name: 'CSV File (.csv)', value: 'text/csv' },
    { name: 'JPEG Image (.jpg)', value: 'image/jpeg' },
    { name: 'PNG Image (.png)', value: 'image/png' },
    { name: 'ZIP Archive (.zip)', value: 'application/zip' }
];