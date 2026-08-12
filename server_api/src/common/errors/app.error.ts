import { ErrorCode } from "./error.codes";

export class AppError extends Error {
    code: ErrorCode;
    statusCode: number;
    details?: unknown;
    constructor(
        code: ErrorCode,
        message?: string,
        statusCode = 400,
        details?: unknown
    ) {
        super(message || code);
        
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}