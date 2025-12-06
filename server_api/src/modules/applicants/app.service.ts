import { Unit } from "../organization/organization.enum";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CreateApplicantDTO, UpdateApplicantDTO, GetApplicantsDTO, UpdateRolesDTO } from "./applicant.dto";
import { IApplicantRepository, ApplicantRepository } from "./applicant.repository";

export class ApplicantService {

    private repository: IApplicantRepository;
    private orgnRepo: IOrganizationRepository;

    constructor(repository?: IApplicantRepository, orgnRepo?: IOrganizationRepository) {
        this.repository = repository || new ApplicantRepository();
        this.orgnRepo = orgnRepo || new OrganizationRepository();
    }

    async validateWorkspace(workspace: string) {
        const organDoc = await this.orgnRepo.findById(workspace);
        if (!organDoc) {
            throw new Error('Workspace is not found');
        }        
        if (organDoc.type !== Unit.Department && organDoc.type !== Unit.External) {
            throw new Error("Invalid Workspace.");
        }
    }
    // -------------------------
    // CREATE
    // -------------------------
    async create(dto: CreateApplicantDTO) {
        await this.validateWorkspace(dto.workspace);
        const created = await this.repository.create(dto);
        return created;
    }
    // -------------------------
    // GET ALL (with optional filter)
    // -------------------------
    async getAll(filter?: GetApplicantsDTO) {
        return this.repository.findAll(filter);
    }  
    // -------------------------
    // UPDATE
    // -------------------------
    async update(dto: UpdateApplicantDTO) {
        const { id, data } = dto;
        if (data.workspace) {
            await this.validateWorkspace(data.workspace);
        }
        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error("Applicant not found");
        return updated;
    }

    // -------------------------
    async updateRoles(dto: UpdateRolesDTO) {
        const { id, data } = dto;
        const updated = await this.repository.updateRoles(id, data);
        if (!updated) throw new Error("Applicant not found");
        return updated;
    }

    // -------------------------
    // DELETE
    // -------------------------
    async delete(id: string) {
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error("Applicant not found");
        return deleted;
    }
}
