import { ErrorCode } from "./error.codes";

export class AppError extends Error {
    code: ErrorCode;
    statusCode: number;

    constructor(code: ErrorCode, statusCode = 400) {
        super(code);
        this.code = code;
        this.statusCode = statusCode;
    }
}