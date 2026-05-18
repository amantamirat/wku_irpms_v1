// organization.service.ts
import { IOrganizationRepository } from "./organization.repository";
import {
    CreateOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { UserRepository, IUserRepository } from "../users/user.repository";
import { IEnrollmentRepository, EnrollmentRepository } from "../users/enrollments/enrollment.repository";
import { Unit } from "../../common/constants/enums";
import { GrantRepository, IGrantRepository } from "../grants/grant.repository";
import { AppError } from "../../common/errors/app.error";
import { ExperienceRepository } from "../users/experiences/experience.repository";

export class OrganizationService {


    constructor(private readonly repo: IOrganizationRepository,
        private userRepo: IUserRepository = new UserRepository(),
        private studentRepo: IEnrollmentRepository = new EnrollmentRepository(),
        private grantRepo: IGrantRepository = new GrantRepository(),
        private exprienceRepo = new ExperienceRepository(),
    ) {
    }

    // ----------------------------------------------------
    // FIND LIST (filter by type, parent)
    // ----------------------------------------------------
    async getAll(filters: GetOrganizationsDTO) {
        return this.repo.find(filters);
    }


    async validateParent(type: Unit, parent: string) {
        if (type === Unit.department || type === Unit.program || type === Unit.center) {
            const organDoc = await this.repo.findById(parent);
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
        return this.repo.create(dto);
    }

    async getById(id: string) {
        const organDoc = await this.repo.findById(id);
        if (!organDoc) throw new AppError(ERROR_CODES.ORGANIZATION_NOT_FOUND);
        return organDoc;
    }


    // ----------------------------------------------------
    // UPDATE ORGANIZATION
    // ----------------------------------------------------
    async update(dto: UpdateOrganizationDTO) {
        const { id, data } = dto;
        const orgDoc = await this.repo.update(id, data);
        if (!orgDoc) {
            throw new Error(ERROR_CODES.ORGANIZATION_NOT_FOUND);
        }
        return orgDoc;
    }


    // ----------------------------------------------------
    // DELETE ORGANIZATION
    // ----------------------------------------------------
    async delete(id: string) {
        const orgnDoc = await this.repo.findById(id);

        if (!orgnDoc) {
            throw new Error(ERROR_CODES.ORGANIZATION_NOT_FOUND);
        }

        const orgType = orgnDoc.type;

        const childExist = await this.repo.exists({ parent: id });

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
            const exists = await this.studentRepo.exists({ program: id });
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
        return await this.repo.delete(id);
    }
}
