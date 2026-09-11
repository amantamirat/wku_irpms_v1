import { ErrorCode } from "./error.codes";

export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        message?: string,
        public statusCode = 400,
        public details?: unknown
    ) {
        super(message || code);
        this.name = "AppError";

        Object.setPrototypeOf(this, AppError.prototype);
    }
}