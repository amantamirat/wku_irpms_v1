import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";

import {
    CreateUserDTO,
    UpdateUserDTO,
    FilterUsersDTO,
    UpdateRolesDTO
} from "./user.dto";

import {
    IUserRepository,
    UserRepository
} from "./user.repository";

import {
    IOrganizationRepository,
    OrganizationRepository
} from "../organization/organization.repository";

import {
    IRoleRepository,
    RoleRepository
} from "../permissions/roles/role.repository";

import { Unit } from "../../common/constants/enums";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { IUser, UserScope } from "./user.model";
import { toObjectId } from "../../common/utils/mongoose.utils";


export class UserService {

    constructor(
        private repo: IUserRepository = new UserRepository(),
        private orgnRepo: IOrganizationRepository =
            new OrganizationRepository(),
        private roleRepository: IRoleRepository =
            new RoleRepository()
    ) { }


    // -------------------------
    // VALIDATE WORKSPACE
    // -------------------------

    async validateWorkspace(workspace: string) {

        const organization =
            await this.orgnRepo.findById(workspace);

        if (!organization) {
            throw new AppError(
                ERROR_CODES.WORKSPACE_NOT_FOUND
            );
        }

        if (
            organization.type !== Unit.department &&
            organization.type !== Unit.external
        ) {
            throw new AppError(
                ERROR_CODES.INVALID_WORKSPACE
            );
        }
    }


    // -------------------------
    // CREATE
    // -------------------------

    async create(
        dto: CreateUserDTO,
        createdBy?: string
    ) {

        if (dto.workspace) {
            await this.validateWorkspace(
                dto.workspace
            );
        }

        const defaultRoles =
            await this.roleRepository.findDefaults();

        const data = {
            workspace: dto.workspace,
            name: dto.name,
            birthDate: dto.birthDate,
            gender: dto.gender,
            fin: dto.fin,
            orcid: dto.orcid,
            accessibility: dto.accessibility ?? [],
            specializations: dto.specializations,
            roles: defaultRoles.map(role =>
                String(role._id)
            ),
            scope: null,
            createdBy
        };

        return this.repo.create({
            ...data,
            workspace: dto.workspace
                ? toObjectId(dto.workspace)
                : undefined,
            specializations:
                dto.specializations?.map(toObjectId),

            roles: defaultRoles.map(role =>
                toObjectId(String(role._id))
            ),
            createdBy: createdBy
                ? toObjectId(createdBy)
                : undefined
        });
    }


    // -------------------------
    // GET ACTIVE USERS
    // -------------------------

    async getAll(
        filter: FilterUsersDTO,
        options?: FilterOptions
    ) {
        return this.repo.find(
            filter,
            options
        );
    }


    // -------------------------
    // GET DELETED USERS
    // -------------------------

    async getDeleted(
        filter: FilterUsersDTO,
        options?: FilterOptions
    ) {
        return this.repo.findDeleted(
            filter,
            options
        );
    }


    // -------------------------
    // LOOKUP
    // -------------------------

    async lookup(
        filter: FilterUsersDTO
    ) {

        const users = await this.repo.find(
            filter
        );

        return users.map(user => ({
            _id: user._id,
            name: user.name,
            orcid: user.orcid
        }));
    }


    // -------------------------
    // FIND ONE
    // -------------------------

    async findOne(
        filter: FilterUsersDTO
    ) {
        return this.repo.findOne(filter);
    }


    // -------------------------
    // UPDATE
    // -------------------------

    async update(
        dto: UpdateUserDTO,
        updatedBy?: string
    ) {

        const { id, data } = dto;

        if (data.workspace !== undefined) {

            if (data.workspace) {
                await this.validateWorkspace(
                    data.workspace
                );
            }
        }

        const updated = await this.repo.update(
            id,
            data,
            updatedBy
        );

        if (!updated) {
            throw new AppError(
                ERROR_CODES.USER_NOT_FOUND,
                "The requested user could not be found."
            );
        }

        return updated;
    }


    // -------------------------
    // UPDATE ROLES
    // -------------------------

    async updateRoles(
        dto: UpdateRolesDTO,
        updatedBy?: string
    ) {

        const updated =
            await this.repo.updateRoles(
                dto.id,
                dto,
                updatedBy
            );

        if (!updated) {
            throw new AppError(
                ERROR_CODES.USER_NOT_FOUND,
                "The requested user could not be found."
            );
        }

        return updated;
    }


    // -------------------------
    // UPDATE SCOPE
    // -------------------------

    async updateScope(
        userId: string,
        scope: string[] | "*" | null,
        updatedBy: string
    ) {

        let normalizedScope:
            string[] | "*" | null;

        if (scope === "*") {

            normalizedScope = "*";

        } else if (scope === null) {

            normalizedScope = null;

        } else {

            if (!Array.isArray(scope)) {
                throw new AppError(
                    ERROR_CODES.INVALID_SCOPE,
                    "Invalid user scope."
                );
            }

            const organizationIds = [
                ...new Set(scope)
            ];

            if (!organizationIds.length) {
                normalizedScope = null;
            } else {

                const organizations =
                    await this.orgnRepo.find({
                        ids: organizationIds
                    });

                if (
                    organizations.length !==
                    organizationIds.length
                ) {
                    throw new AppError(
                        ERROR_CODES.ORGANIZATION_NOT_FOUND,
                        "One or more scope organizations could not be found."
                    );
                }

                const allowedTypes = [
                    Unit.department,
                    Unit.directorate,
                    Unit.external
                ];

                const invalidOrganization =
                    organizations.find(
                        organization =>
                            !allowedTypes.includes(
                                organization.type
                            )
                    );

                if (invalidOrganization) {
                    throw new AppError(
                        ERROR_CODES.INVALID_SCOPE,
                        "Only departments, directorates, and external organizations can be assigned as user scope."
                    );
                }

                normalizedScope =
                    organizationIds;
            }
        }

        return this.repo.updateScope(
            userId,
            normalizedScope,
            updatedBy
        );
    }


    // -------------------------
    // SOFT DELETE
    // -------------------------

    async delete(
        id: string,
        deletedBy?: string
    ) {

        const deleted =
            await this.repo.softDelete(
                id,
                deletedBy
            );

        if (!deleted) {
            throw new AppError(
                ERROR_CODES.USER_NOT_FOUND,
                "The requested user could not be found."
            );
        }

        return deleted;
    }


    // -------------------------
    // RESTORE
    // -------------------------

    async restore(
        id: string,
        restoredBy?: string
    ) {

        const restored =
            await this.repo.restore(
                id,
                restoredBy
            );

        if (!restored) {
            throw new AppError(
                ERROR_CODES.USER_NOT_FOUND,
                "The deleted user could not be found."
            );
        }

        return restored;
    }



}