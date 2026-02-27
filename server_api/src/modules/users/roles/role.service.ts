import { AppError } from "../../../common/errors/app.error";
import { ERROR_CODES } from "../../../common/errors/error.codes";
import { DeleteDto } from "../../../util/delete.dto";
import { ApplicantRepository, IApplicantRepository } from "../../applicants/applicant.repository";
import { PermissionRepository } from "../permissions/permission.repository";
import { CreateRoleDto, UpdateRoleDto } from "./role.dto";
import { RoleRepository } from "./role.repository";
import fs from 'fs/promises';
import path from 'path';

export class RoleService {

    constructor(
        private readonly repository: RoleRepository,
        private readonly permissionRepository: PermissionRepository = new PermissionRepository(),
        private readonly appRepo: IApplicantRepository = new ApplicantRepository()
    ) {
        (async () => {
            await this.seedRoles();
        })();
    }

    async create(dto: CreateRoleDto) {
        const created = await this.repository.create(dto);
        return created;
    }

    async getAll() {
        return await this.repository.findAll();
    }

    async seedRoles() {
        const filePath = path.join(process.cwd(), 'data', 'roles.json');
        const rawData = await fs.readFile(filePath, 'utf-8');
        const roles = JSON.parse(rawData);

        /*
        const dbRoles = await this.repository.findAll();
        if (dbRoles.length > 0) {
            return;
        }
        */

        const allPermissions = await this.permissionRepository.findAll();

        let seeded = false;

        for (const role of roles) {
            const exists = await this.repository.findByName(role.name);
            if (exists) continue;

            const permissionIds = await this.resolvePermissions(
                role.permissions,
                allPermissions
            );

            await this.repository.create({
                name: role.name,
                permissions: permissionIds,
                isDefault: !!role.isDefault
            });
            seeded = true;
        }
        if (seeded) console.log("Roles seeded with wildcard support");

    }


    async update(dto: UpdateRoleDto) {
        const { id, data } = dto;
        const updated = await this.repository.update(id, data);
        if (!updated) throw new AppError(ERROR_CODES.ROLE_NOT_FOUND);
        return updated;
    }

    async delete(dto: DeleteDto) {
        const { id } = dto;
        const exist = await this.appRepo.exists({ role: id });
        if (exist) throw new AppError(ERROR_CODES.ROLE_IN_USE);
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.ROLE_NOT_FOUND);
        return deleted;
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

            // 2️⃣ Prefix wildcard -> project:* or document:status.*
            if (pattern.includes("*")) {
                const prefix = pattern.replace("*", "");

                const matched = allPermissions.filter(p =>
                    p.name.startsWith(prefix)
                );

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

}
