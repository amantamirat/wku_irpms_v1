import { Server } from 'socket.io';

export class SocketService {
    private static io: Server;

    static init(server: any) {
        this.io = new Server(server, {
            cors: {
                origin: '*', // adjust for production
            },
        });

        this.io.on('connection', (socket) => {
            const userId = socket.handshake.query.userId as string;

            if (!userId) {
                socket.disconnect();
                return;
            }

            socket.join(`user:${userId}`);

            /*
            console.log(
                `User ${userId} connected with socket ${socket.id}`
            );*/

            socket.on('disconnect', () => {
                /*
                console.log(
                    `User ${userId} disconnected`
                );*/
            });
        });
    }

    static sendNotification(
        userId: string,
        notification: any
    ) {
        if (!this.io) {
            console.warn('SocketService is not initialized');
            return;
        }

        this.io
            .to(`user:${userId}`)
            .emit('new_notification', notification);
    }
}