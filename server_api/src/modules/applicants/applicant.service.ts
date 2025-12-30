import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { Unit } from "../organization/organization.type";
import { IRoleRepository, RoleRepository } from "../users/roles/role.repository";
import { CreateApplicantDTO, UpdateApplicantDTO, GetApplicantsDTO, UpdateRolesDTO, UpdateOwnershipsDTO } from "./applicant.dto";
import { IApplicantRepository, ApplicantRepository } from "./applicant.repository";

export class ApplicantService {

    private repository: IApplicantRepository;
    private orgnRepo: IOrganizationRepository;
    private roleRepository: IRoleRepository;

    constructor(repository?: IApplicantRepository, orgnRepo?: IOrganizationRepository,
        roleRepository?: IRoleRepository
    ) {
        this.repository = repository || new ApplicantRepository();
        this.orgnRepo = orgnRepo || new OrganizationRepository();
        this.roleRepository = roleRepository || new RoleRepository();
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
        const defaultRoles = await this.roleRepository.findDefaults();
        const roles = defaultRoles.map(role => String(role._id));
        const created = await this.repository.create({ ...dto, roles });
        return created;
    }
    // -------------------------
    // GET ALL (with optional filter)
    // -------------------------
    async getAll(filter: GetApplicantsDTO) {
        return await this.repository.findAll(filter);
    }
    // -------------------------
    // UPDATE
    // -------------------------
    async update(dto: UpdateApplicantDTO) {
        const { id, data } = dto;
        if (data.workspace) {
            await this.validateWorkspace(data.workspace);
        }
        //check permission for roles and ownerships !!!!!!danger
        const updated = await this.repository.update(id, data);
        if (!updated) throw new Error("Applicant not found");
        return updated;
    }
    // -------------------------
    // UPDATE_ROLES
    // -------------------------
    async updateRoles(dto: UpdateRolesDTO) {
        const updated = await this.repository.updateRoles(dto.id, dto);
        if (!updated) throw new Error("Applicant not found");
        return updated;
    }
    // -------------------------
    // UPDATE_OWNERSHIP
    // -------------------------
    async updateOwnerships(dto: UpdateOwnershipsDTO) {
        const { id, ownerships } = dto;
        if (!ownerships || ownerships.length === 0) {
            dto.ownerships = []
        }
        const unitTypes = ownerships.map(o => o.unitType);
        if (new Set(unitTypes).size !== unitTypes.length) {
            throw new Error("Duplicate unitType in ownerships");
        }
        for (const o of ownerships) {
            if (!Object.values(Unit).includes(o.unitType)) {
                throw new Error(`Invalid unitType: ${o.unitType}`);
            }
            if (o.scope !== "*" && !Array.isArray(o.scope)) {
                throw new Error(`Invalid scope for unitType ${o.unitType}`);
            }
        }
        const updated = await this.repository.updateOwnerships(id, ownerships);
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
