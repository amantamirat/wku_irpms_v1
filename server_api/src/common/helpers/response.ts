import { Response } from 'express';
import { AppError } from '../errors/app.error';

export const successResponse = (res: Response, statusCode: number = 200, message?: string, data?: any): void => {
    res.status(statusCode).json({ success: true, message, data });
};

export const errorResponse = (
    res: Response,
    statusCode: number = 400,
    responseMessage: string,
    error: unknown
): void => {

    const response: {
        success: false;
        message: string;
        errorName: string;
        errorMessage?: string;
        errorCode?: string;
        errorDetail?: unknown;
    } = {
        success: false,
        message: responseMessage,
        errorName: "Unknown"
    };

    if (error instanceof AppError) {
        response.errorName = "AppError";
        response.errorCode = error.code;
        response.errorMessage = error.message ?? responseMessage;
        response.errorDetail = error.details;
        //response.errorDetail = error.details;
        //console.error("App Error Stack trace:", error.stack);
    } else if (error instanceof Error) {
        response.errorMessage = error.message;
        console.error("Unknown Error Stack trace:", error.stack);
    } else if (typeof error === "string") {
        response.errorMessage = error;
    }

    res.status(statusCode).json(response);
};
