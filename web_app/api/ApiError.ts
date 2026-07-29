export class ApiError extends Error {
    code?: string;
    details?: unknown;
    status?: number;

    constructor(
        message: string,
        options?: {
            code?: string;
            details?: unknown;
            status?: number;
        }
    ) {
        super(message);

        this.name = "ApiError";
        this.code = options?.code;
        this.details = options?.details;
        this.status = options?.status;

        Object.setPrototypeOf(this, ApiError.prototype);
    }
}