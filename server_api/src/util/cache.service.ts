import NodeCache from "node-cache";

export const cache = new NodeCache({
    stdTTL: 2 * 3600,
    checkperiod: 3 * 60,
});

export class CacheService {

    private static userPermissionsKey(userId: string): string {
        return `user:${userId}:permissions`;
    }

    static getUserPermissions(
        userId: string
    ): string[] | undefined {
        return cache.get<string[]>(
            this.userPermissionsKey(userId)
        );
    }

    static setUserPermissions(
        userId: string,
        permissions: string[]
    ): void {
        cache.set(
            this.userPermissionsKey(userId),
            permissions
        );
    }

    static invalidateUser(userId: string): void {
        cache.del(this.userPermissionsKey(userId));
    }
}