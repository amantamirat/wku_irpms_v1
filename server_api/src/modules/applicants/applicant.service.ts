import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ReviewerRepository } from "../calls/stages/reviewers/reviewer.repository";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { Unit } from "../organization/organization.type";
import { CollaboratorRepository, ICollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { IProjectRepository, ProjectRepository } from "../projects/project.repository";
import { IRoleRepository, RoleRepository } from "../permissions/roles/role.repository";
import { CreateApplicantDTO, UpdateApplicantDTO, GetApplicantsDTO, UpdateRolesDTO, UpdateOwnershipsDTO } from "./applicant.dto";
import { IApplicantRepository, ApplicantRepository } from "./applicant.repository";

export class ApplicantService {

    constructor(
        private repository: IApplicantRepository = new ApplicantRepository(),
        private orgnRepo: IOrganizationRepository = new OrganizationRepository(),
        private roleRepository: IRoleRepository = new RoleRepository(),
        private projectRepo: IProjectRepository = new ProjectRepository(),
        private collabRepo: ICollaboratorRepository = new CollaboratorRepository(),
        private reviewerRepo = new ReviewerRepository()
    ) { }

    async validateWorkspace(workspace: string) {
        const organDoc = await this.orgnRepo.findById(workspace);
        if (!organDoc) {
            throw new Error(ERROR_CODES.WORKSPACE_NOT_FOUND);
        }
        if (organDoc.type !== Unit.Department && organDoc.type !== Unit.External) {
            throw new Error(ERROR_CODES.INVALID_WORKSPACE);
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
        if (!updated) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);
        return updated;
    }
    // -------------------------
    // UPDATE_ROLES
    // -------------------------
    async updateRoles(dto: UpdateRolesDTO) {
        const updated = await this.repository.updateRoles(dto.id, dto);
        if (!updated) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);
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
        if (!updated) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);
        return updated;
    }
    // -------------------------
    // DELETE
    // -------------------------
    async delete(id: string) {
        const projectExists = await this.projectRepo.exists({ applicant: id });
        if (projectExists) {
            throw new Error(ERROR_CODES.APPLICANT_HAS_PROJECTS);
        };
        const collabExist = await this.collabRepo.exists({ applicant: id });
        if (collabExist) {
            throw new Error(ERROR_CODES.COLLABORATOR_ALREADY_EXISTS);
        };
        const revExist = await this.reviewerRepo.exist({ applicant: id });
        if (revExist) {
            throw new AppError(ERROR_CODES.REVIEWER_ALREADY_EXISTS);
        }
        const deleted = await this.repository.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.APPLICANT_NOT_FOUND);
        return deleted;
    }
}
