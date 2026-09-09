import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { CacheService } from "../../util/cache.service";
import { IUserRepository } from "../users/user.repository";

export class AuthPermissionService {
    constructor(
        private readonly userRepository: IUserRepository,
    ) { }

    async getUserPermissions(userId: string): Promise<string[]> {
        const cachedPermissions = CacheService.getUserPermissions(userId);

        if (cachedPermissions !== undefined) {
            return cachedPermissions;
        }

        const userDoc = await this.userRepository.findById(userId, {
            populate: true
        });

        if (!userDoc) {
            throw new AppError(ERROR_CODES.USER_NOT_FOUND);
        }

        const permissions = [
            ...new Set(
                userDoc.roles?.flatMap((role: any) =>
                    role.permissions?.map((permission: any) =>
                        permission.name
                    ) ?? []
                ) ?? []
            )
        ];

        CacheService.setUserPermissions(userId, permissions);

        return permissions;
    }

    async hasPermission(
        userId: string,
        permissions: string | string[]
    ): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);

        const requiredPermissions = Array.isArray(permissions)
            ? permissions
            : [permissions];

        return requiredPermissions.some(
            permission => userPermissions.includes(permission)
        );
    }
}