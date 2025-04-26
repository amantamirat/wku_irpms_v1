import { Response } from 'express';

export const successResponse = (res: Response, statusCode: number, message: string, data?: any): void => {
    res.status(statusCode).json({ message, data });
};

export const errorResponse = (res: Response, statusCode: number, message: string, error?: any): void => {
    res.status(statusCode).json({ message, error });
};
