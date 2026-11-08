import { MessageType, NotificationType } from "./notification.model";

export interface CreateNotificationDTO {
    recipient: string;
    sender?: string;
    title: string;
    message: string;
    messageType?: MessageType;
    type?: NotificationType;
    link?: string;
    expiresAt?: Date;
}

export interface FilterNotificationsDTO {
    recipient?: string;
    isRead?: boolean;
    type?: NotificationType;
    limit?: number;
}

export interface UpdateNotificationDTO {
    isRead?: boolean;
}

export interface MarkAllAsReadDTO {
    recipient: string;
}