import { ErrorCode } from "./error.codes";

export class AppError extends Error {
    code: ErrorCode;
    statusCode: number;

    constructor(code: ErrorCode, message?: string, statusCode = 400,) {
        super(message || code);

        this.code = code;
        this.statusCode = statusCode;

        Object.setPrototypeOf(this, AppError.prototype);
    }
}