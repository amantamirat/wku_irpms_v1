import { INotificationRepository } from "./notification.repository";
import { CreateNotificationDTO, GetNotificationsDTO } from "./notification.dto";
import { NotificationType } from "./notification.model";
import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { SettingService } from "../../settings/setting.service";
import { SettingKey } from "../../settings/setting.model";
import { ProjectStageStatus } from "../../projects/stages/project.stage.status";
import { SocketService } from "./socket.service";
import { ClientSession } from "mongoose";

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
            link: '/projects/collaborators/applicant'
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

    /**
 * Specific Business Helper: Notify user about a project stage status change.
 */
    async notifyStatusChange(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        newStatus: ProjectStageStatus
    ) {
        let statusAction: string;
        let type: NotificationType = NotificationType.INFO;

        // Map statuses to more natural, user-friendly verbs
        switch (newStatus) {
            case ProjectStageStatus.accepted:
                statusAction = "has been approved";
                type = NotificationType.SUCCESS;
                break;
            case ProjectStageStatus.rejected:
                statusAction = "was not selected";
                type = NotificationType.ERROR;
                break;
            case ProjectStageStatus.reviewed:
                statusAction = "has been reviewed";
                type = NotificationType.SUCCESS;
                break;
            case ProjectStageStatus.selected:
                statusAction = "is now being processed";
                type = NotificationType.INFO;
                break;
            default:
                statusAction = `is now ${newStatus}`;
        }

        return this.notify({
            recipient: recipientId,
            title: "Project Update",
            message: `Your "${projectTitle}" ${stageName} ${statusAction}.`,
            type: type,
            link: `/projects/applicant`
        });
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
            link: '/reviewers/applicant'
        });
    }

    /**
     * Specific Business Helper: Notify Lead PI when someone joins.
     * async notifyCollaboratorJoined(leadPIId: string, collaboratorName: string, projectTitle: string) {
        return this.notify({
            recipient: leadPIId,
            title: "Collaborator Joined",
            message: `${collaboratorName} has verified their status in "${projectTitle}".`,
            type: NotificationType.SUCCESS
        });
    }
     */

}