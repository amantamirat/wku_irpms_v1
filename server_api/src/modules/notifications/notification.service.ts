import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { SettingKey } from "../settings/setting.model";
import { SettingService } from "../settings/setting.service";
import { CreateNotificationDTO, GetNotificationsDTO } from "./notification.dto";
import { NotificationType } from "./notification.model";
import { INotificationRepository } from "./notification.repository";
import { SocketService } from "./socket.service";

export class NotificationService {
    constructor(private readonly repository: INotificationRepository,
        private readonly settingService: SettingService
    ) { }

    /**
     * Core method to send a notification. 
     * In the future, you can trigger Socket.io or Emails here.
     */
    // notification.service.ts

    async notify(dto: CreateNotificationDTO) {
        // 1. Fetch the expiry setting (e.g., 720 hours = 30 days)
        const expiryHr = await this.settingService.getSettingValue(SettingKey.NOTIFICATION_EXPIRY_HOURS, 720);

        // 2. Calculate the specific date
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + expiryHr);

        // 3. Create the notification with the dynamic date
        const notification = await this.repository.create({
            ...dto,
            expiresAt: expiryDate
        } as any);
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
    async notifyProjectInvitation(recipientId: string, projectTitle: string, role?: string, senderId?: string) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "New Project Invitation",
            message: `You have been added as a ${role ?? 'collaborator'} to "${projectTitle}".`,
            type: NotificationType.INFO,
            link: '/projects/collaborators/my-memberships'
        });
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


    async notifyApplicationSubmitted(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Application Submitted",
            message:
                `Your application "${projectTitle}" for the "${stageName}" stage ` +
                `has been submitted successfully.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }


    async notifyApplicationAccepted(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        nextStageInfo?: {
            name: string;
            deadline?: Date;
        },
        senderId?: string
    ) {
        let message =
            `Congratulations! Your application "${projectTitle}" for the ` +
            `"${stageName}" stage has been accepted.`;

        if (nextStageInfo) {
            const deadlineStr = nextStageInfo.deadline
                ? ` by ${nextStageInfo.deadline.toLocaleDateString()}`
                : "";

            message +=
                ` Please prepare for the next stage: ` +
                `"${nextStageInfo.name}"${deadlineStr}.`;
        }

        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Application Accepted",
            message,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }

    async notifyApplicationRejected(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Application Rejected",
            message:
                `We regret to inform you that your application "${projectTitle}" ` +
                `for the "${stageName}" stage was not selected.`,
            type: NotificationType.ERROR,
            link: "/dashboard/my-projects"
        });
    }

    /**
     async notifyApplicationReturnedToPending(
     recipientId: string,
projectTitle: string,

stageName: string,

senderId?: string

) {

return this.notify({

recipient: recipientId,

sender: senderId,

title: "Application Returned for Review",

message:

`Your application "${projectTitle}" for the "${stageName}" ` +

`stage has been returned to pending status for further review.`,

type: NotificationType.INFO,

link: "/dashboard/my-projects"

});

}
     */

    async notifyRollback(
        recipientId: string,
        title: string,
        status: string,
        stageName?: string,
        senderId?: string
    ) {
        const stageMessage = stageName
            ? ` for the "${stageName}" stage`
            : "";

        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Returned for Review",
            message:
                `Your "${title}"${stageMessage} ` +
                `has been returned to ${status} status for further review.`,
            type: NotificationType.INFO,
            link: "/dashboard/my-projects"
        });
    }

    async notifyApplicationWithdrawn(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Application Withdrawn",
            message:
                `Your application "${projectTitle}" for the "${stageName}" ` +
                `stage has been withdrawn successfully.`,
            type: NotificationType.WARNING,
            link: "/dashboard/my-projects"
        });
    }


    async notifyProjectFinalization(
        recipientId: string,
        projectTitile: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Project Requires Finalization",
            message:
                `The project "${projectTitile}" has been approved and requires finalization before funding. ` +
                `Please review and update the project phases, timelines, and budget, and ensure all required information is complete.`,
            type: NotificationType.INFO,
            link: "/dashboard/my-projects"
        });
    }


    async notifyProjectRefusal(
        recipientId: string,
        ptojectTitle: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Project Refused",
            message:
                `We regret to inform you that your project "${ptojectTitle}" has been refused during finalization. `,
            type: NotificationType.ERROR,
            link: "/dashboard/my-projects"
        });
    }

    /**
 * Specific Business Helper: Notify user about a project stage status change.*/
    /*
        async notifyStatusChange(
            recipientId: string,
            projectTitle: string, // Pass the whole project for context
            stageName: string,
            newStatus: ApplicationStatus,
            nextStageInfo?: { name: string, deadline?: Date } // New optional param        
        ) {
            let message: string;
            let type: NotificationType = NotificationType.INFO;
    
            switch (newStatus) {
                case ApplicationStatus.pending:
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
                link: `/dashboard/my-projects`
            });
        }
            */


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
            link: '/dashboard/my-evaluations'
        });
    }


    async notifyVerificationSubmitted(
        recipientId: string,
        projectTitle: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Verification Submitted",
            message:
                `A verification document for your project "${projectTitle}" ` +
                `has been submitted successfully.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }



}