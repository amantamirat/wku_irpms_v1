import { Response } from 'express';
import { AppError } from '../errors/app.error';

export const successResponse = (res: Response, statusCode: number = 200, message?: string, data?: any): void => {
    res.status(statusCode).json({ success: true, message, data });
};

export const errorResponse = (
    res: Response,
    statusCode: number = 400,
    message: string,
    error?: any
): void => {

    console.log("Error:", message, error || '');
    const response: any = { success: false, message, };

    if (error instanceof AppError) {

        response.code = error.code;

        if (error.details) {
            response.details = error.details;
        }

    } else if (error) {

        response.error = error.message || error;

    }


    res.status(statusCode).json(response);
};
