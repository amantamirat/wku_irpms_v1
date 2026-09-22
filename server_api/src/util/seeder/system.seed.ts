import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

import {
    accountRepo,
    permissionRepo,
    roleRepo,
    settingRepo,
    userRepo
} from "../../core/container";

import { AccountStatus } from "../../modules/accounts/account.model";
import { IAccountRepository } from "../../modules/accounts/account.repository";
import { IPermissionRepository } from "../../modules/permissions/permission.repository";
import { IRoleRepository } from "../../modules/permissions/roles/role.repository";
import { SettingKey } from "../../modules/settings/setting.model";
import { ISettingRepository } from "../../modules/settings/setting.repository";
import { Gender } from "../../modules/users/user.model";
import { IUserRepository } from "../../modules/users/user.repository";
import { toObjectId } from "../../common/utils/mongoose.utils";

export class SystemSeeder {

    constructor(
        private readonly settingRepo: ISettingRepository,
        private readonly permissionRepo: IPermissionRepository,
        private readonly roleRepo: IRoleRepository,
        private readonly accountRepo: IAccountRepository,
        private readonly userRepo: IUserRepository
    ) { }

    async run() {
        console.log("🛠️ System Bootstrap Started...");

        // 1. System settings
        await this.seedSettings();

        // 2. Permissions
        await this.seedPermissions();

        // 3. Roles
        await this.seedRoles();

        // 4. Initial administrator
        await this.seedAdmin();

        console.log("✅ System Bootstrap Finished.");
    }

    private async seedSettings() {
        try {
            const filePath = path.join(
                process.cwd(),
                "data/system",
                "defaultSettings.json"
            );

            const rawData = await fs.readFile(
                filePath,
                "utf-8"
            );

            const settings = JSON.parse(rawData);

            let seeded = false;

            for (const item of settings) {
                if (!item.key) {
                    continue;
                }

                const exists =
                    await this.settingRepo.findByKey(
                        item.key as SettingKey
                    );

                if (exists) {
                    continue;
                }

                await this.settingRepo.create(
                    item.key as SettingKey,
                    item.value,
                    item.type,
                    item.description
                );

                seeded = true;
            }

            if (seeded) {
                console.log(
                    "✅ System settings seeded from JSON"
                );
            }

        } catch (error) {
            console.error(
                "❌ Error seeding settings:",
                error
            );
        }
    }

    private async seedPermissions() {
        const filePath = path.join(
            process.cwd(),
            "data/system",
            "permissions.json"
        );

        const rawData = await fs.readFile(
            filePath,
            "utf-8"
        );

        const permissions = JSON.parse(rawData);

        let seeded = false;

        for (const permission of permissions) {
            if (!permission.name) {
                continue;
            }

            const exists =
                await this.permissionRepo.findByName(
                    permission.name
                );

            if (exists) {
                continue;
            }

            await this.permissionRepo.create(permission);

            seeded = true;
        }

        if (seeded) {
            console.log(
                "Permissions seeded from JSON"
            );
        }
    }

    private async seedRoles() {
        const filePath = path.join(
            process.cwd(),
            "data/system",
            "roles.json"
        );

        const rawData = await fs.readFile(
            filePath,
            "utf-8"
        );

        const roles = JSON.parse(rawData);

        const allPermissions =
            await this.permissionRepo.findAll();

        let seeded = false;

        for (const role of roles) {

            const exists =
                await this.roleRepo.findByName(
                    role.name,
                    { populate: true }
                );

            if (exists) {
                continue;
            }

            const permissionIds =
                await this.resolvePermissions(
                    role.permissions,
                    allPermissions
                );

            await this.roleRepo.create({
                name: role.name,
                permissions: permissionIds,
                isDefault: !!role.isDefault
            });

            seeded = true;
        }

        if (seeded) {
            console.log(
                "Roles seeded with wildcard support"
            );
        }
    }

    private async resolvePermissions(
        permissionPatterns: string[],
        allPermissions: any[]
    ) {
        const resolvedPermissions =
            new Map<string, any>();

        for (const pattern of permissionPatterns) {

            // Full wildcard
            if (pattern === "*") {
                allPermissions.forEach(permission => {
                    resolvedPermissions.set(
                        permission.name,
                        permission._id
                    );
                });

                continue;
            }

            // Wildcard pattern
            if (pattern.includes("*")) {

                const patternParts =
                    pattern.split(":");

                const matched =
                    allPermissions.filter(permission => {

                        const permissionParts =
                            permission.name.split(":");

                        if (
                            permissionParts.length !==
                            patternParts.length
                        ) {
                            return false;
                        }

                        return patternParts.every(
                            (part, index) =>
                                part === "*" ||
                                part === permissionParts[index]
                        );
                    });

                matched.forEach(permission => {
                    resolvedPermissions.set(
                        permission.name,
                        permission._id
                    );
                });

                continue;
            }

            // Exact permission
            const exact =
                allPermissions.find(
                    permission =>
                        permission.name === pattern
                );

            if (exact) {
                resolvedPermissions.set(
                    exact.name,
                    exact._id
                );
            }
        }

        return Array.from(
            resolvedPermissions.values()
        );
    }

    private async seedAdmin() {

        // Do not create another administrator
        // if an account already exists.
        if (await this.accountRepo.exists({})) {
            return;
        }

        const adminEmail =
            process.env.EMAIL;

        if (!adminEmail) {
            console.warn(
                "⚠️ EMAIL is not configured. Initial admin was not created."
            );

            return;
        }

        console.log(
            "🚀 No users found. Seeding initial admin..."
        );

        let root =
            await this.roleRepo.findByName("root");

        if (!root) {

            const allPermissions =
                await this.permissionRepo.findAll();

            const permissionIds =
                allPermissions.map(
                    permission =>
                        String(permission._id)
                );

            root =
                await this.roleRepo.create({
                    name: "root",
                    permissions: permissionIds,
                    isDefault: false
                });
        }

        const admin =
            await this.userRepo.create({
                name: process.env.ADMIN_NAME || "System Administrator",
                birthDate: new Date(),
                gender: Gender.Female,
                roles: [toObjectId(String(root._id))],
                scope: "*",
                accessibility: [],
                isSystem: true
            });

        const hashedPassword =
            await bcrypt.hash(
                process.env.PASSWORD || "Admin@123",
                10
            );

        await this.accountRepo.create({
            email: adminEmail,
            password: hashedPassword,
            user: String(admin._id),
            status: AccountStatus.active
        });

        console.log(
            "✅ Initial admin created successfully."
        );
    }
}

export function createSystemSeeder() {
    return new SystemSeeder(
        settingRepo,
        permissionRepo,
        roleRepo,
        accountRepo,
        userRepo
    );
}


