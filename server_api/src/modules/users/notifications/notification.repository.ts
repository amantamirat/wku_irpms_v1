import mongoose from "mongoose";
import { Notification, INotification } from "./notification.model";
import {
    CreateNotificationDTO,
    GetNotificationsDTO,
    UpdateNotificationDTO,
    MarkAllAsReadDTO
} from "./notification.dto";

export interface INotificationRepository {
    findById(id: string): Promise<INotification | null>;
    find(filters: GetNotificationsDTO): Promise<INotification[]>;
    create(dto: CreateNotificationDTO): Promise<INotification>;
    update(id: string, data: UpdateNotificationDTO["data"]): Promise<INotification | null>;
    markAllAsRead(filters: MarkAllAsReadDTO): Promise<number>;
    delete(id: string): Promise<INotification | null>;
}

export class NotificationRepository implements INotificationRepository {

    async findById(id: string) {
        return Notification.findById(new mongoose.Types.ObjectId(id))
            .populate("sender", "name") // Optional: only if you need sender names
            .lean<INotification>()
            .exec();
    }

    async find(filters: GetNotificationsDTO) {
        const query: any = {};

        if (filters.recipient) {
            query.recipient = new mongoose.Types.ObjectId(filters.recipient);
        }

        if (filters.isRead !== undefined) {
            query.isRead = filters.isRead;
        }

        if (filters.type) {
            query.type = filters.type;
        }

        let dbQuery = Notification.find(query).sort({ createdAt: -1 });

        if (filters.limit) {
            dbQuery = dbQuery.limit(filters.limit);
        }

        return dbQuery
            .lean<INotification[]>()
            .exec();
    }

    async create(dto: CreateNotificationDTO) {
        const data: Partial<INotification> = {
            recipient: new mongoose.Types.ObjectId(dto.recipient),
            title: dto.title,
            message: dto.message,
            type: dto.type,
            link: dto.link,
            expiresAt: dto.expiresAt
        };

        if (dto.sender) {
            data.sender = new mongoose.Types.ObjectId(dto.sender);
        }

        return Notification.create(data);
    }

    async update(id: string, dtoData: UpdateNotificationDTO["data"]): Promise<INotification | null> {
        const updateData: Partial<INotification> = {};

        if (dtoData.isRead !== undefined) {
            updateData.isRead = dtoData.isRead;
        }

        return Notification.findByIdAndUpdate(
            new mongoose.Types.ObjectId(id),
            { $set: updateData },
            { new: true }
        ).exec();
    }

    // Utility for the common "Clear all notifications" action
    async markAllAsRead(filters: MarkAllAsReadDTO): Promise<number> {
        const result = await Notification.updateMany(
            { recipient: new mongoose.Types.ObjectId(filters.recipient), isRead: false },
            { $set: { isRead: true } }
        ).exec();

        return result.modifiedCount;
    }

    async delete(id: string) {
        return Notification.findByIdAndDelete(
            new mongoose.Types.ObjectId(id)
        ).exec();
    }
}