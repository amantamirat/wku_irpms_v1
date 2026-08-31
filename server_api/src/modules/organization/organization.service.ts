// organization.service.ts
import { Unit } from "../../common/constants/enums";
import { FilterOptions } from "../../common/dtos/filter.dto";
import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { IGrantRepository } from "../grants/grant.repository";
import { IEnrollmentRepository } from "../users/enrollments/enrollment.repository";
import { IExperienceRepository } from "../users/experiences/experience.repository";
import { IUserRepository } from "../users/user.repository";
import {
    CreateOrganizationDTO,
    FilterOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { IOrganizationRepository } from "./organization.repository";

export class OrganizationService {


    constructor(
        private readonly organizationRepo: IOrganizationRepository,
        private readonly userRepo: IUserRepository,
        private readonly grantRepo: IGrantRepository,
        private readonly enrollmentRepo: IEnrollmentRepository,
        private readonly exprienceRepo: IExperienceRepository,
    ) {
    }

    // ----------------------------------------------------
    // FIND LIST (filter by type, parent)
    // ----------------------------------------------------
    async getAll(filters: FilterOrganizationsDTO, options?: FilterOptions) {
        return this.organizationRepo.find(filters, options);
    }


    async validateParent(type: Unit, parent: string) {
        if (type === Unit.department || type === Unit.program || type === Unit.center) {
            const organDoc = await this.organizationRepo.findById(parent);
            if (!organDoc) {
                throw new Error(ERROR_CODES.ORGANIZATION_PARENT_NOT_FOUND);
            }
            const parentType = organDoc.type;
            if ((type === Unit.department && parentType !== Unit.college) ||
                (type === Unit.program && parentType !== Unit.department) ||
                (type === Unit.center && parentType !== Unit.directorate)
            ) {
                throw new Error(ERROR_CODES.INVALID_PARENT_TYPE);
            }
        }
    }

    // ----------------------------------------------------
    // CREATE ORGANIZATION
    // ----------------------------------------------------
    async create(dto: CreateOrganizationDTO) {
        const { name, type, parent, academicLevel, classification, ownership } = dto;
        // validate parent relationship
        if (parent) {
            await this.validateParent(type, parent);
        }
        return this.organizationRepo.create(dto);
    }

    async getById(id: string) {
        const organDoc = await this.organizationRepo.findById(id);
        if (!organDoc) throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
        return organDoc;
    }


    // ----------------------------------------------------
    // UPDATE ORGANIZATION
    // ----------------------------------------------------
    async update(dto: UpdateOrganizationDTO) {
        const { id, data } = dto;
        const orgDoc = await this.organizationRepo.update(id, data);
        if (!orgDoc) {
            throw new Error(ERROR_CODES.ORGANIZATION_NOT_FOUND);
        }
        return orgDoc;
    }


    // ----------------------------------------------------
    // DELETE ORGANIZATION
    // ----------------------------------------------------
    async delete(id: string) {
        const orgnDoc = await this.organizationRepo.findById(id);

        if (!orgnDoc) {
            throw new Error(ERROR_CODES.ORGANIZATION_NOT_FOUND);
        }

        const orgType = orgnDoc.type;

        const childExist = await this.organizationRepo.exists({ parent: id });

        if (childExist) {
            throw new AppError(
                ERROR_CODES.ORGANIZATION_IN_USE,
                `Cannot delete "${orgnDoc.name}" because it contains child organizations.`
            );
        }

        if (orgType === Unit.external || orgType === Unit.department) {
            const userExists = await this.userRepo.exists({ workspace: id });
            if (userExists) {
                throw new AppError(
                    ERROR_CODES.ORGANIZATION_IN_USE,
                    `Cannot delete "${orgnDoc.name}" because users are assigned to it.`
                );
            }

            const expExists = await this.exprienceRepo.exists({ organization: id });

            if (expExists) {
                throw new AppError(
                    ERROR_CODES.ORGANIZATION_IN_USE,
                    `Cannot delete "${orgnDoc.name}" because experiences are linked to it.`
                );
            }
        }

        if (orgType === Unit.program) {
            const exists = await this.enrollmentRepo.exists({ program: id });
            if (exists) {
                throw new AppError(
                    ERROR_CODES.ORGANIZATION_IN_USE,
                    `Cannot delete "${orgnDoc.name}" because students are assigned to it.`
                );
            }
        }

        if (orgType === Unit.directorate || orgType === Unit.external) {
            const exists = await this.grantRepo.exists({ organization: id });
            if (exists) {
                throw new AppError(
                    ERROR_CODES.ORGANIZATION_IN_USE,
                    `Cannot delete "${orgnDoc.name}" because grants are linked to it.`
                );
            }
        }
        return await this.organizationRepo.delete(id);
    }
}
