import { Unit } from "../organization/organization.enum";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CreateApplicantDTO, UpdateApplicantDTO, GetApplicantsDTO } from "./applicant.dto";
import { IApplicantRepository, ApplicantRepository } from "./applicant.repository";

export class ApplicantService {

    private repository: IApplicantRepository;
    private orgnRepo: IOrganizationRepository;

    constructor(repository?: IApplicantRepository, orgnRepo?: IOrganizationRepository) {
        this.repository = repository || new ApplicantRepository();
        this.orgnRepo = orgnRepo || new OrganizationRepository();
    }

    async validateOrganization(organization: string) {
        const organDoc = await this.orgnRepo.findById(organization);
        if (!organDoc) {
            throw new Error('Organization is not found');
        }
        
        if (organDoc.type !== Unit.Department && organDoc.type !== Unit.External) {
            throw new Error("Invalid Organization Type.");
        }
    }
    // -------------------------
    // CREATE
    // -------------------------
    async create(dto: CreateApplicantDTO) {
        await this.validateOrganization(dto.organization);
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
    // GET ONE BY ID
    // -------------------------
    /*
    async getById(id: string) {
        const applicant = await this.repository.findById(id);
        if (!applicant) throw new Error("Applicant not found");
        return applicant;
    }
    */

    // -------------------------
    // UPDATE
    // -------------------------
    async update(dto: UpdateApplicantDTO) {
        const { id, data } = dto;
        if (data.organization) {
            await this.validateOrganization(data.organization);
        }
        const updated = await this.repository.update(id, data);
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
