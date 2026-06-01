import { INotificationRepository } from "./notification.repository";
import { CreateNotificationDTO, GetNotificationsDTO } from "./notification.dto";
import { NotificationType } from "./notification.model";
import { SocketService } from "./socket.service";
import { ClientSession } from "mongoose";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ApplicationStatus } from "../projects/applications/project.application.model";
import { SettingKey } from "../settings/setting.model";
import { SettingService } from "../settings/setting.service";

export class NotificationService {
    constructor(private readonly repository: INotificationRepository,
        private readonly settingService: SettingService
    ) { }

    /**
     * Core method to send a notification. 
     * In the future, you can trigger Socket.io or Emails here.
     */
    // notification.service.ts

    async notify(dto: CreateNotificationDTO, session?: ClientSession) {
        // 1. Fetch the expiry setting (e.g., 720 hours = 30 days)
        const expiryHr = await this.settingService.getSettingValue(SettingKey.NOTIFICATION_EXPIRY_HOURS, 720);

        // 2. Calculate the specific date
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + expiryHr);

        // 3. Create the notification with the dynamic date
        const notification = await this.repository.create({
            ...dto,
            expiresAt: expiryDate
        } as any, session);
        // TODO: Integration point for Real-time updates
        SocketService.sendNotification(dto.recipient, notification);

        return notification;
    }


    /**
     * Fetches the "Inbox" for a specific user.
     * Logic: Only get the user's own notifications, sorted by newest first.
     */
    async getMyNotifications(userId: string, limit: number = 20) {
        const filters: GetNotificationsDTO = {
            recipient: userId,
            limit: limit
        };
        return this.repository.find(filters);
    }

    /**
     * Mark a specific notification as read.
     * Logic: Ensure the notification actually belongs to the user requesting the update.
     */
    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.repository.findById(notificationId);

        if (!notification) {
            throw new AppError(ERROR_CODES.NOTIFICATION_NOT_FOUND);
        }

        // Security Check: Prevent User A from marking User B's notification as read
        if (String(notification.recipient) !== userId) {
            throw new AppError(ERROR_CODES.UNAUTHORIZED);
        }

        return this.repository.update(notificationId, { isRead: true });
    }

    /**
     * Bulk action to clear the inbox.
     */
    async markAllAsRead(userId: string) {
        return this.repository.markAllAsRead({ recipient: userId });
    }

    /**
     * Specific Business Helper: Notify a user they've been invited.
     * Keeps the CollaboratorService code clean.
     */
    async notifyProjectInvitation(recipientId: string, projectTitle: string, role?: string, senderId?: string, session?: ClientSession) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "New Project Invitation",
            message: `You have been added as a ${role ?? 'collaborator'} to "${projectTitle}".`,
            type: NotificationType.INFO,
            link: '/projects/collaborators/my-memberships'
        }, session);
    }

    async notifyProjectRemoval(recipientId: string, projectTitle: string, role?: string, senderId?: string) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Removed from Project",
            message: `You have been removed as a ${role ?? 'collaborator'} from "${projectTitle}".`,
            type: NotificationType.ERROR,
            //link: '/projects'
        });
    }


    async notifyProjectFinalization(
        recipientId: string,
        projectDoc: any,
        senderId?: string,
        session?: ClientSession
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Project Requires Finalization",
            message:
                `The project "${projectDoc.title}" requires final phase review and updates. ` +
                `Please review phase timelines, budgets, and mark phases as reviewed.`,
            type: NotificationType.INFO,
            link: `/projects/${projectDoc._id}`
        }, session);
    }

    /**
 * Specific Business Helper: Notify user about a project stage status change.*/
    async notifyStatusChange(
        recipientId: string,
        projectTitle: string, // Pass the whole project for context
        stageName: string,
        newStatus: ApplicationStatus,
        nextStageInfo?: { name: string, deadline?: Date }, // New optional param
        session?: ClientSession
    ) {
        let message: string;
        let type: NotificationType = NotificationType.INFO;

        switch (newStatus) {
            case ApplicationStatus.submitted:
                message = `Your application "${projectTitle}" for ${stageName} has been submitted successfully.`;
                type = NotificationType.SUCCESS;
                break;

            case ApplicationStatus.accepted:
                message = `Congratulations! Your application "${projectTitle}" for ${stageName} has been accepted.`;
                // Add "Next Step" info if available
                if (nextStageInfo) {
                    const deadlineStr = nextStageInfo.deadline
                        ? ` by ${nextStageInfo.deadline.toLocaleDateString()}`
                        : "";
                    message += ` Please prepare for the next stage: "${nextStageInfo.name}"${deadlineStr}.`;
                }
                type = NotificationType.SUCCESS;
                break;

            case ApplicationStatus.rejected:
                message = `We regret to inform you that your application "${projectTitle}" for ${stageName} was not selected.`;
                type = NotificationType.ERROR;
                break;
            default:
                message = `Your application "${projectTitle}" for ${stageName} is now marked as ${newStatus}.`;
        }

        return this.notify({
            recipient: recipientId,
            title: "Project Update",
            message,
            type,
            link: `/projects/my-projects`
        }, session);
    }


    async notifyReviewerAssigned(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Reviewer Assignment",
            message: `You have been assigned as a reviewer for "${projectTitle}" in the "${stageName}" stage.`,
            type: NotificationType.INFO,
            link: '/reviewers/my-evaluations'
        });
    }



}