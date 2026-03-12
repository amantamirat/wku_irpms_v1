// organization.service.ts
import { IOrganizationRepository } from "./organization.repository";
import {
    CreateOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ApplicantRepository, IApplicantRepository } from "../applicants/applicant.repository";
import { IStudentRepository, StudentRepository } from "../applicants/students/student.repository";
import { Unit } from "../../common/constants/enums";

export class OrganizationService {


    constructor(private readonly repo: IOrganizationRepository,
        private appRepo: IApplicantRepository = new ApplicantRepository(),
        private studentRepo: IStudentRepository = new StudentRepository(),
    ) {
    }

    // ----------------------------------------------------
    // FIND LIST (filter by type, parent)
    // ----------------------------------------------------
    async getAll(filters: GetOrganizationsDTO) {
        return this.repo.find(filters);
    }


    async validateParent(type: Unit, parent: string) {
        if (type === Unit.Department || type === Unit.Program || type === Unit.Center) {
            const organDoc = await this.repo.findById(parent);
            if (!organDoc) {
                throw new Error(ERROR_CODES.ORGANIZATION_PARENT_NOT_FOUND);
            }
            const parentType = organDoc.type;
            if ((type === Unit.Department && parentType !== Unit.College) ||
                (type === Unit.Program && parentType !== Unit.Department) ||
                (type === Unit.Center && parentType !== Unit.Directorate)
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
            throw new Error(ERROR_CODES.ORGANIZATION_HAS_CHILDREN);
        }
        if (orgType === Unit.External || orgType === Unit.Department) {
            this.appRepo.exists({ workspace: id }).then(exists => {
                if (exists) {
                    throw new Error(ERROR_CODES.ORGANIZATION_IN_USE);
                }
            });
        }
        if (orgType === Unit.Program) {
            this.studentRepo.exists({ program: id }).then(exists => {
                if (exists) {
                    throw new Error(ERROR_CODES.ORGANIZATION_IN_USE);
                }
            });
        }
        return await this.repo.delete(id);
    }
}
