import { Response } from 'express';

export const successResponse = (res: Response, statusCode: number = 200, message: string, data?: any): void => {
    res.status(statusCode).json({ message, data });
};

export const errorResponse = (res: Response, statusCode: number = 401, message: string, error?: any): void => {
    res.status(statusCode).json({ message, error });
};
