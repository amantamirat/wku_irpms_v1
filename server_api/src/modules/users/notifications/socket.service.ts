import { Server } from 'socket.io';

export class SocketService {
    private static io: Server;
    private static userSockets = new Map<string, string>(); // Maps applicantId -> socketId

    static init(server: any) {
        this.io = new Server(server, {
            cors: { origin: "*" } // Adjust for production
        });

        this.io.on('connection', (socket) => {
            const applicantId = socket.handshake.query.applicantId as string;
            if (applicantId) {
                this.userSockets.set(applicantId, socket.id);
            }

            socket.on('disconnect', () => {
                this.userSockets.delete(applicantId);
            });
        });
    }

    static sendNotification(applicantId: string, notification: any) {
        const socketId = this.userSockets.get(applicantId);
        if (socketId) {
            this.io.to(socketId).emit('new_notification', notification);
        }
    }
}