import { Response } from 'express';
import { NotificationService } from './notification.service';
import { AppError } from '../../common/errors/app.error';
import { ERROR_CODES } from '../../common/errors/error.codes';
import { successResponse, errorResponse } from '../../common/helpers/response';
import { AuthenticatedRequest } from '../auth/auth.middleware';

export class NotificationController {
    constructor(private readonly service: NotificationService) { }

    // -----------------------
    // Get My Notifications
    // -----------------------
    getInbox = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const { limit } = req.query;
            const userId = req.user.applicantId;

            const notifications = await this.service.getMyNotifications(
                userId,
                limit ? parseInt(limit as string) : 20
            );

            successResponse(res, 200, 'Notifications fetched successfully', notifications);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Mark Single as Read
    // -----------------------
    markAsRead = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const { id } = req.params; // Notification ID
            const userId = req.user.applicantId;

            const updated = await this.service.markAsRead(id, userId);

            successResponse(res, 200, 'Notification marked as read', updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

    // -----------------------
    // Mark All as Read
    // -----------------------
    markAllRead = async (req: AuthenticatedRequest, res: Response) => {
        try {
            if (!req.user) throw new AppError(ERROR_CODES.UNAUTHORIZED);

            const userId = req.user.applicantId;
            const modifiedCount = await this.service.markAllAsRead(userId);

            successResponse(res, 200, 'All notifications marked as read', { modifiedCount });
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };
}