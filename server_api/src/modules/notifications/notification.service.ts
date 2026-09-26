import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { SettingKey } from "../settings/setting.model";
import { SettingService } from "../settings/setting.service";
import {
    CreateNotificationDTO,
    GetNotificationsDTO
} from "./notification.dto";
import { NotificationType } from "./notification.model";
import { INotificationRepository } from "./notification.repository";
import { SocketService } from "./socket.service";

export class NotificationService {
    constructor(
        private readonly repository: INotificationRepository,
        private readonly settingService: SettingService
    ) { }

    /**
     * Core method to send a notification.
     */
    async notify(dto: CreateNotificationDTO) {
        const expiryHr =
            await this.settingService.getSettingValue(
                SettingKey.NOTIFICATION_EXPIRY_HOURS,
                720
            );

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + expiryHr);

        const notification = await this.repository.create({
            ...dto,
            expiresAt: expiryDate
        } as any);

        SocketService.sendNotification(
            dto.recipient,
            notification
        );

        return notification;
    }

    /**
     * Fetch the inbox for a specific user.
     */
    async getMyNotifications(
        userId: string,
        limit: number = 20
    ) {
        const filters: GetNotificationsDTO = {
            recipient: userId,
            limit
        };

        return this.repository.find(filters);
    }

    /**
     * Mark a specific notification as read.
     */
    async markAsRead(
        notificationId: string,
        userId: string
    ) {
        const notification =
            await this.repository.findById(notificationId);

        if (!notification) {
            throw new AppError(
                ERROR_CODES.NOTIFICATION_NOT_FOUND
            );
        }

        if (String(notification.recipient) !== userId) {
            throw new AppError(
                ERROR_CODES.UNAUTHORIZED
            );
        }

        return this.repository.update(
            notificationId,
            { isRead: true }
        );
    }

    /**
     * Mark all notifications as read.
     */
    async markAllAsRead(userId: string) {
        return this.repository.markAllAsRead({
            recipient: userId
        });
    }

    // =========================================================
    // COLLABORATOR NOTIFICATIONS
    // =========================================================

    async notifyProjectInvitation(
        recipientId: string,
        projectTitle: string,
        role?: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "New Project Invitation",
            message:
                `You have been added as a ${role ?? "collaborator"} ` +
                `to "${projectTitle}".`,
            type: NotificationType.INFO,
            link: "/dashboard/my-memberships"
        });
    }

    /**
     * Notify a collaborator that their invitation was declined.
     */
    async notifyProjectInvitationDeclined(
        recipientId: string,
        projectTitle: string,
        role?: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Project Invitation Declined",
            message:
                `Your invitation to add the user as a ` +
                `${role ?? "collaborator"} to "${projectTitle}" ` +
                `has been declined.`,
            type: NotificationType.ERROR,
            link: "/dashboard/my-projects"
        });
    }

    /**
     * Notify a project owner/lead when a collaborator is verified.
     */
    async notifyCollaboratorVerified(
        recipientId: string,
        projectTitle: string,
        collaboratorName?: string,
        senderId?: string
    ) {
        const collaboratorMessage = collaboratorName
            ? `${collaboratorName} has been verified as a collaborator`
            : `A collaborator has been verified`;

        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Collaborator Verified",
            message:
                `${collaboratorMessage} for your project ` +
                `"${projectTitle}".`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }

    /**
     * Notify a project owner/lead when a collaborator is declined.
     */
    async notifyCollaboratorDeclined(
        recipientId: string,
        projectTitle: string,
        collaboratorName?: string,
        senderId?: string
    ) {
        const collaboratorMessage = collaboratorName
            ? `${collaboratorName}'s collaboration request`
            : `A collaborator's request`;

        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Collaborator Declined",
            message:
                `${collaboratorMessage} for "${projectTitle}" ` +
                `has been declined.`,
            type: NotificationType.ERROR,
            link: "/dashboard/my-projects"
        });
    }

    async notifyProjectRemoval(
        recipientId: string,
        projectTitle: string,
        role?: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Removed from Project",
            message:
                `You have been removed as a ${role ?? "collaborator"} ` +
                `from "${projectTitle}".`,
            type: NotificationType.ERROR
        });
    }

    // =========================================================
    // APPLICATION NOTIFICATIONS
    // =========================================================

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
                `Your application "${projectTitle}" for the ` +
                `"${stageName}" stage has been submitted successfully.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }

    async notifyApplicationShortlisted(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Application Shortlisted",
            message:
                `Congratulations! Your application "${projectTitle}" ` +
                `for the "${stageName}" stage has been shortlisted ` +
                `for further evaluation.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }

    /**
     * Notify an applicant that their application was not shortlisted.
     */
    async notifyApplicationNotShortlisted(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Application Not Shortlisted",
            message:
                `Your application "${projectTitle}" for the ` +
                `"${stageName}" stage was not shortlisted for ` +
                `further evaluation.`,
            type: NotificationType.ERROR,
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
            `Congratulations! Your application "${projectTitle}" ` +
            `for the "${stageName}" stage has been accepted.`;

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
                `We regret to inform you that your application ` +
                `"${projectTitle}" for the "${stageName}" stage ` +
                `was not selected.`,
            type: NotificationType.ERROR,
            link: "/dashboard/my-projects"
        });
    }

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
                `Your "${title}"${stageMessage} has been returned ` +
                `to ${status} status for further review.`,
            type: NotificationType.INFO,
            link: "/dashboard/my-projects"
        });
    }

    // =========================================================
    // PROJECT NOTIFICATIONS
    // =========================================================

    async notifyProjectRefusal(
        recipientId: string,
        projectTitle: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Project Refused",
            message:
                `We regret to inform you that your project ` +
                `"${projectTitle}" has been refused during finalization.`,
            type: NotificationType.ERROR,
            link: "/dashboard/my-projects"
        });
    }

    // =========================================================
    // REVIEWER NOTIFICATIONS
    // =========================================================

    async notifyReviewerAssigned(
        recipientId: string,
        projectTitle: string,
        contextName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Reviewer Assignment",
            message:
                `You have been assigned as a reviewer for ` +
                `"${projectTitle}" in "${contextName}".`,
            type: NotificationType.INFO,
            link: "/dashboard/my-evaluations"
        });
    }

    /**
     * Notify the reviewer-assigner that an application needs reviewers.
     */
    async notifyReviewerAssigner(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Reviewer Assignment Required",
            message:
                `Reviewers need to be assigned to the application ` +
                `"${projectTitle}" for the "${stageName}" stage.`,
            type: NotificationType.INFO,
            link: "/dashboard/assigned-applications"
        });
    }

    async notifyReviewerAssignerRemoved(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Reviewer Assigner Role Removed",
            message:
                `You are no longer responsible for assigning reviewers ` +
                `for the application "${projectTitle}" in the ` +
                `"${stageName}" stage.`,
            type: NotificationType.INFO,
            link: "/dashboard/assigned-applications"
        });
    }



    /**
     * Notify an applicant/reviewer-assigner that reviewer assignment
     * has been completed.
     */
    async notifyReviewersAssigned(
        recipientId: string,
        projectTitle: string,
        stageName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Reviewers Assigned",
            message:
                `Reviewers have been assigned to the application ` +
                `"${projectTitle}" for the "${stageName}" stage.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }

    /**
     * Notify a reviewer that their review was verified.
     */
    async notifyReviewerVerified(
        recipientId: string,
        projectTitle: string,
        contextName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Review Verified",
            message:
                `Your review for "${projectTitle}" in ` +
                `"${contextName}" has been verified.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-evaluations"
        });
    }

    /**
     * Notify a reviewer that their review was declined/rejected.
     */
    async notifyReviewerDeclined(
        recipientId: string,
        projectTitle: string,
        contextName: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Review Declined",
            message:
                `Your review for "${projectTitle}" in ` +
                `"${contextName}" has been declined.`,
            type: NotificationType.ERROR,
            link: "/dashboard/my-evaluations"
        });
    }

    // =========================================================
    // VERIFICATION NOTIFICATIONS
    // =========================================================

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
                `A verification document for your project ` +
                `"${projectTitle}" has been submitted successfully.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }

    /**
     * Notify the project owner that verification was completed.
     */
    async notifyVerificationVerified(
        recipientId: string,
        projectTitle: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Verification Completed",
            message:
                `The verification for your project "${projectTitle}" ` +
                `has been completed successfully.`,
            type: NotificationType.SUCCESS,
            link: "/dashboard/my-projects"
        });
    }

    /**
     * Notify the project owner that verification was rejected.
     */
    async notifyVerificationRejected(
        recipientId: string,
        projectTitle: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Verification Rejected",
            message:
                `The verification for your project "${projectTitle}" ` +
                `has been rejected. Please review the verification ` +
                `requirements and take the necessary action.`,
            type: NotificationType.ERROR,
            link: "/dashboard/my-projects"
        });
    }

    /**
     * Notify the project owner that verification was rolled back.
     */
    async notifyVerificationRollback(
        recipientId: string,
        projectTitle: string,
        senderId?: string
    ) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            title: "Verification Returned for Review",
            message:
                `The verification for your project "${projectTitle}" ` +
                `has been returned for further review.`,
            type: NotificationType.INFO,
            link: "/dashboard/my-projects"
        });
    }
}

