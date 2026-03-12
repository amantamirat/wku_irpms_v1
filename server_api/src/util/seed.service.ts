import fs from 'fs/promises';
import path from 'path';
import bcrypt from "bcryptjs";
import { ApplicantRepository } from "../modules/applicants/applicant.repository";
import { Gender } from "../modules/applicants/applicant.enum";
import { UserRepository } from "../modules/users/user.repository";
import { UserStatus } from "../modules/users/user.status";
import { PermissionRepository } from "../modules/permissions/permission.repository";
import { RoleRepository } from '../modules/permissions/roles/role.repository';
import { SettingRepository } from '../modules/settings/setting.repository';
import { SettingKey } from '../modules/settings/setting.model';
import { Unit } from '../common/constants/enums';

export class SeedService {
    constructor(
        private settingRepo = new SettingRepository(),
        private permissionRepo: PermissionRepository = new PermissionRepository(),
        private roleRepo = new RoleRepository(),
        private userRepo = new UserRepository(),
        private applicantRepo = new ApplicantRepository()
    ) { }

    async runAllSeeds() {
        console.log("🛠️  System Bootstrap Started...");

        // 1. First, set up the global rules (Settings)
        await this.seedSettings();

        // 2. Set up the atomic actions (Permissions)
        await this.seedPermissions();

        // 3. Bundle them (Roles)
        await this.seedRoles();

        // 4. Create the janitor (Admin User)
        await this.seedAdmin();

        console.log("✅ System Bootstrap Finished.");
    }

    async seedSettings() {
        try {
            const filePath = path.join(process.cwd(), 'data', 'defaultSettings.json');
            const rawData = await fs.readFile(filePath, 'utf-8');
            const settings = JSON.parse(rawData);

            let seeded = false;

            for (const item of settings) {
                if (!item.key) continue;

                // Check existence using the Enum key
                const exists = await this.settingRepo.findByKey(item.key as SettingKey);

                if (!exists) {
                    await this.settingRepo.create(
                        item.key as SettingKey,
                        item.value,
                        item.type,
                        item.description
                    );
                    seeded = true;
                }
            }

            if (seeded) console.log('✅ System settings seeded from JSON');
        } catch (error) {
            console.error('❌ Error seeding settings:', error);
        }
    }

    async seedPermissions() {
        const filePath = path.join(process.cwd(), 'data', 'permissions.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const permissions = JSON.parse(rawData);

        let seeded = false;

        for (const perm of permissions) {
            if (!perm.name) continue;
            const exists = await this.permissionRepo.findByName(perm.name);
            if (!exists) {
                await this.permissionRepo.create(perm);
                seeded = true;
            }
        }
        if (seeded) console.log('Permissions seeded from JSON');
    }


    async seedRoles() {
        const filePath = path.join(process.cwd(), 'data', 'roles.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const roles = JSON.parse(rawData);

        const allPermissions = await this.permissionRepo.findAll();

        let seeded = false;

        for (const role of roles) {
            const exists = await this.roleRepo.findByName(role.name);
            if (exists) continue;

            const permissionIds = await this.resolvePermissions(
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
        if (seeded) console.log("Roles seeded with wildcard support");

    }


    private async resolvePermissions(
        permissionPatterns: string[],
        allPermissions: any[]
    ) {
        const resolvedPermissions = new Map<string, any>();

        for (const pattern of permissionPatterns) {

            // 1️⃣ Full wildcard -> *
            if (pattern === "*") {
                allPermissions.forEach(p =>
                    resolvedPermissions.set(p.name, p._id)
                );
                continue;
            }

            // 2️⃣ Prefix wildcard -> project:* // Now modified to include nested permissions (removes the dot restriction)
            if (pattern.includes("*")) {
                const prefix = pattern.replace("*", "");

                const matched = allPermissions.filter(p => p.name.startsWith(prefix));

                matched.forEach(p =>
                    resolvedPermissions.set(p.name, p._id)
                );

                continue;
            }

            // 3️⃣ Exact permission
            const exact = allPermissions.find(p => p.name === pattern);
            if (exact) {
                resolvedPermissions.set(exact.name, exact._id);
            }
        }

        return Array.from(resolvedPermissions.values());
    }

    async seedAdmin() {
        const adminEmail = process.env.EMAIL;
        if (!adminEmail) return;

        const existingAdmin = await this.userRepo.findByEmail(adminEmail);
        if (existingAdmin) return;

        console.log("🚀 No admin found. Seeding initial admin...");

        const ownerships: any[] = Object.values(Unit).map(
            (unit) => ({
                unitType: unit,
                scope: "*"
            })
        );

        // 1. Create an Applicant record for the admin
        const applicant = await this.applicantRepo.create({
            name: "System Administrator",
            birthDate: new Date(),
            gender: Gender.Female,
            // Add roles/permissions as needed for your schema
        });

        const role = await this.roleRepo.findByName("root");
        if (!role) return
        const roleId = String(role._id);
        const appId = String(applicant._id);
        await this.applicantRepo.updateRoles(appId, { id: appId, roles: [roleId] });
        await this.applicantRepo.updateOwnerships(appId, ownerships);

        // 2. Create the User record
        const hashedPassword = await bcrypt.hash(process.env.PASSWORD || "Admin@123", 10);

        await this.userRepo.create({
            email: adminEmail,
            password: hashedPassword,
            applicant: String(applicant._id),
            status: UserStatus.active
        });

        console.log("✅ Initial admin created successfully.");
    }
}