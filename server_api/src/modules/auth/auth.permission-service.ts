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
        // Cache hit
        if (cachedPermissions !== undefined) {
            return cachedPermissions;
        }
        // Cache miss → load from MongoDB
        const userDoc = await this.userRepository.findById(userId, { populate: true });
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
        // Rebuild cache
        CacheService.setUserPermissions(userId, permissions);
        return permissions;
    }
}