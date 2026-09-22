import { CacheService } from "../../util/cache.service";
import { IUserRepository } from "../users/user.repository";
import { IRoleRepository, PopulatedRole } from "../permissions/roles/role.repository";


export class AuthPermissionService {

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly roleRepository: IRoleRepository
    ) { }

    async getUserPermissions(
        userId: string
    ): Promise<string[]> {

        const cachedPermissions =
            CacheService.getUserPermissions(userId);

        if (cachedPermissions !== undefined) {
            return cachedPermissions;
        }

        const userDoc =
            await this.userRepository.findById(userId);

        if (!userDoc) {
            return [];
        }

        const roles =
            await this.roleRepository.findByIds(
                userDoc.roles.map(role => String(role)),
                { populate: true }
            );

        const populatedRoles =
            roles as PopulatedRole[];

        const permissions = [
            ...new Set(
                populatedRoles.flatMap(role =>
                    role.permissions.map(
                        permission => permission.name
                    )
                )
            )
        ];

        CacheService.setUserPermissions(
            userId,
            permissions
        );

        return permissions;
    }

    async hasPermission(
        userId: string,
        permissions: string | string[]
    ): Promise<boolean> {

        const userPermissions =
            await this.getUserPermissions(userId);

        const requiredPermissions =
            Array.isArray(permissions)
                ? permissions
                : [permissions];

        return requiredPermissions.some(
            permission =>
                userPermissions.includes(permission)
        );
    }
}

