import { Server } from 'socket.io';

export class SocketService {
    private static io: Server;
    private static userSockets = new Map<string, string>(); // Maps userId -> socketId

    static init(server: any) {
        this.io = new Server(server, {
            cors: { origin: "*" } // Adjust for production
        });

        this.io.on('connection', (socket) => {
            const userId = socket.handshake.query.userId as string;
            //unsafe the client can request other userid
            if (userId) {
                this.userSockets.set(userId, socket.id);
            }

            socket.on('disconnect', () => {
                this.userSockets.delete(userId);
            });
        });
    }

    static sendNotification(userId: string, notification: any) {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
            this.io.to(socketId).emit('new_notification', notification);
        }
    }
}