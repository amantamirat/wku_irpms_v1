import { Grant } from "../../../grants/models/grant.model";

export enum VerificationConfigurationStatus {
    active = "active",
    closed = "closed"
}

export type VerificationConfiguration = {
    _id?: string;
    grant: string | Grant;
    deadline: Date | string;
    template?: string;
    minReviewers: number;
    maxReviewers: number;
    maxAttempts: number;
    status: VerificationConfigurationStatus;
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateVerificationConfiguration = (
    config: Partial<VerificationConfiguration>
): { valid: boolean; message?: string } => {
    if (!config.grant || config.grant.toString().trim() === "") {
        return { valid: false, message: "Grant ID is required." };
    }

    if (!config.deadline) {
        return { valid: false, message: "Deadline is required." };
    }

    const deadlineDate = new Date(config.deadline);
    if (isNaN(deadlineDate.getTime())) {
        return { valid: false, message: "Invalid deadline date." };
    }

    if (config.minReviewers === undefined || config.minReviewers < 1) {
        return { valid: false, message: "Minimum reviewers must be at least 1." };
    }

    if (config.maxReviewers === undefined || config.maxReviewers < config.minReviewers) {
        return {
            valid: false,
            message: "Maximum reviewers must be greater than or equal to minimum reviewers.",
        };
    }

    if (config.maxAttempts === undefined || config.maxAttempts < 1) {
        return { valid: false, message: "Maximum attempts must be at least 1." };
    }

    if (
        !config.status ||
        !Object.values(VerificationConfigurationStatus).includes(config.status)
    ) {
        return { valid: false, message: "A valid status (active or closed) is required." };
    }

    return { valid: true };
};

export function sanitizeVerificationConfiguration(
    config: Partial<VerificationConfiguration>
): Partial<VerificationConfiguration> {
    const extractId = (val: unknown): string | undefined => {
        if (!val) return undefined;
        if (typeof val === "string") return val;
        if (typeof val === "object" && val !== null && "_id" in val) {
            return String((val as { _id: unknown })._id);
        }
        return String(val);
    };

    return {
        ...config,
        grant: extractId(config.grant) ?? "",
        template: extractId(config.template),
        minReviewers: config.minReviewers !== undefined ? Number(config.minReviewers) : undefined,
        maxReviewers: config.maxReviewers !== undefined ? Number(config.maxReviewers) : undefined,
        maxAttempts: config.maxAttempts !== undefined ? Number(config.maxAttempts) : undefined,
        deadline: config.deadline ? new Date(config.deadline) : undefined,
    };
}

export const createEmptyVerificationConfiguration = (): VerificationConfiguration => ({
    grant: "",
    deadline: new Date(),
    minReviewers: 1,
    maxReviewers: 1,
    maxAttempts: 1,
    status: VerificationConfigurationStatus.active,
});