import { NotificationType } from "./notification.model";

export interface CreateNotificationDTO {
    recipient: string;
    sender?: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
    expiresAt?: Date;
}

export interface GetNotificationsDTO {
    recipient?: string;
    isRead?: boolean;
    type?: NotificationType;
    limit?: number;
}

export interface UpdateNotificationDTO {
    data: {
        isRead?: boolean;
    };
}

export interface MarkAllAsReadDTO {
    recipient: string;
}