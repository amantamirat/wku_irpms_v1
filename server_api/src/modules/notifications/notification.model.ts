import mongoose, { Schema, Document } from 'mongoose';
import { COLLECTIONS } from '../../common/constants/collections.enum';


export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId; // Links to IApplicant
    sender?: mongoose.Types.ObjectId;    // Optional: who triggered it
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    link?: string;                      // Optional: URL to redirect the user
    expiresAt: Date;
    createdAt: Date;
}


const NotificationSchema: Schema = new Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
            required: true,
            index: true // Optimized for querying a specific user's alerts
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: COLLECTIONS.USER,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: Object.values(NotificationType),
            default: NotificationType.INFO
        },
        isRead: { type: Boolean, default: false },
        link: { type: String },
        expiresAt: {
            type: Date,
            required: true,
            default: () => {
                const date = new Date();
                date.setDate(date.getDate() + 30); // Adds 30 days
                return date;
            },
            index: { expires: 0 } // This makes it dynamic!
        }
    },
    { timestamps: true } // Automatically handles createdAt and updatedAt
);

/**
 * TTL Index: Automatically delete notifications after 30 days.
 * 60 seconds * 60 minutes * 24 hours * 30 days = 2,592,000 seconds
 */
//NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);