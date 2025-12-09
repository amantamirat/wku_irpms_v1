// organization.service.ts
import { IOrganizationRepository } from "./organization.repository";
import {
    CreateOrganizationDTO,
    GetOrganizationsDTO,
    UpdateOrganizationDTO
} from "./organization.dto";
import { Unit } from "./organization.enum";

export class OrganizationService {

    private readonly repo: IOrganizationRepository;

    constructor(repository: IOrganizationRepository) {
        this.repo = repository;
    }

    // ----------------------------------------------------
    // FIND LIST (filter by type, parent)
    // ----------------------------------------------------
    async getAll(filters: GetOrganizationsDTO) {
        return this.repo.find(filters);
    }


    async validateParent(type: Unit, parentId: string) {
        if (type === Unit.Department || type === Unit.Program || type === Unit.Center) {
            const organDoc = await this.repo.findById(parentId);
            if (!organDoc) {
                throw new Error('Parent is not found');
            }
            const parentType = organDoc.type;
            if ((type === Unit.Department && parentType !== Unit.College) ||
                (type === Unit.Program && parentType !== Unit.Department) ||
                (type === Unit.Center && parentType !== Unit.Directorate)
            ) {
                throw new Error(`Invalid parent ${parentType} for ${type} found`);
                //"Department must belong to a College",
                //"Center must belong to a Directorate",
                //"Program must belong to a Department",
            }
        }
    }

    // ----------------------------------------------------
    // CREATE ORGANIZATION
    // ----------------------------------------------------
    async create(data: CreateOrganizationDTO) {
        if (!data.name || !data.type) {
            throw new Error("Organization name and type are required");
        }
        return this.repo.create(data);
    }

    // ----------------------------------------------------
    // UPDATE ORGANIZATION
    // ----------------------------------------------------
    async update(id: string, dto: UpdateOrganizationDTO) {
        if (!dto.data || Object.keys(dto.data).length === 0) {
            throw new Error("No update data provided");
        }
        return this.repo.update(id, dto.data);
    }

    // ----------------------------------------------------
    // DELETE ORGANIZATION
    // ----------------------------------------------------
    async delete(id: string) {
        const existing = await this.repo.findById(id);
        if (!existing) {
            throw new Error("Organization not found");
        }
        await this.repo.delete(id);
        return { message: "Organization deleted successfully" };
    }
}
