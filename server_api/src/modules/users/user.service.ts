import { AppError } from "../../common/errors/app.error";
import { ERROR_CODES } from "../../common/errors/error.codes";
import { ReviewerRepository } from "../reviewers/reviewer.repository";
import { IOrganizationRepository, OrganizationRepository } from "../organization/organization.repository";
import { CollaboratorRepository, ICollaboratorRepository } from "../projects/collaborators/collaborator.repository";
import { IProjectRepository, ProjectRepository } from "../projects/project.repository";
import { IRoleRepository, RoleRepository } from "../permissions/roles/role.repository";
import { CreateUserDTO, UpdateUserDTO, GetUsersDTO, UpdateRolesDTO, UpdateOwnershipsDTO } from "./user.dto";
import { IUserRepository, UserRepository } from "./user.repository";
import { Unit } from "../../common/constants/enums";
import { EnrollmentRepository } from "./enrollments/enrollment.repository";
import { ExperienceRepository } from "./experiences/experience.repository";
import { PublicationRepository } from "./publications/publication.repository";

export class UserService {

    constructor(
        private repo: IUserRepository = new UserRepository(),
        private orgnRepo: IOrganizationRepository = new OrganizationRepository(),
        private roleRepository: IRoleRepository = new RoleRepository(),
        private projectRepo: IProjectRepository = new ProjectRepository(),
        private collabRepo: ICollaboratorRepository = new CollaboratorRepository(),
        private reviewerRepo = new ReviewerRepository(),
        private exprienceRepo = new ExperienceRepository(),
        private enrollmentRepo = new EnrollmentRepository(),
        private publicationRepo = new PublicationRepository(),
    ) { }

    async validateWorkspace(workspace: string) {
        const organDoc = await this.orgnRepo.findById(workspace);
        if (!organDoc) {
            throw new Error(ERROR_CODES.WORKSPACE_NOT_FOUND);
        }
        if (organDoc.type !== Unit.department && organDoc.type !== Unit.external) {
            throw new Error(ERROR_CODES.INVALID_WORKSPACE);
        }
    }
    // -------------------------
    // CREATE
    // -------------------------
    async create(dto: CreateUserDTO) {
        if (dto.workspace)
            await this.validateWorkspace(dto.workspace);
        //throw new AppError(ERROR_CODES.WORKSPACE_NOT_FOUND);       
        const defaultRoles = await this.roleRepository.findDefaults();
        const roles = defaultRoles.map(role => String(role._id));
        const created = await this.repo.create({ ...dto, roles });
        return created;
    }
    // -------------------------
    // GET ALL (with optional filter)
    // -------------------------
    async getAll(filter: GetUsersDTO) {
        return await this.repo.findAll(filter);
    }
    // -------------------------
    // UPDATE
    // -------------------------
    async update(dto: UpdateUserDTO) {
        const { id, data } = dto;
        if (data.workspace) {
            await this.validateWorkspace(data.workspace);
        }
        //check permission for roles and ownerships !!!!!!danger
        const updated = await this.repo.update(id, data);
        if (!updated) throw new Error(ERROR_CODES.USER_NOT_FOUND);
        return updated;
    }
    // -------------------------
    // UPDATE_ROLES
    // -------------------------
    async updateRoles(dto: UpdateRolesDTO) {
        const updated = await this.repo.updateRoles(dto.id, dto);
        if (!updated) throw new Error(ERROR_CODES.USER_NOT_FOUND);
        return updated;
        //if (!updated) throw new Error("User not found");
        // Optional: audit log
        // await AuditLog.create({ actor: dto.updatedBy, action: "user:role:update", target: userId, payload: dto.roles });
        //return updated;
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
        const updated = await this.repo.updateOwnerships(id, ownerships);
        if (!updated) throw new Error(ERROR_CODES.USER_NOT_FOUND);
        return updated;
    }
    // -------------------------
    // DELETE
    // -------------------------
    async delete(id: string) {
        const userDoc = await this.repo.findById(id);
        if (!userDoc) {
            throw new AppError(ERROR_CODES.USER_NOT_FOUND, "The requested user could not be found.");
        }
        // 1. Check for professional experience records
        const experienceExist = await this.exprienceRepo.exists({ user: id });
        if (experienceExist) {
            throw new AppError(
                ERROR_CODES.USER_IN_USE,
                `Cannot delete "${userDoc.name}" because they have employment or professional experience records linked to their profile. Please remove these experience logs first.`
            );
        }

        // 2. Check for student academic enrollment ties
        const enrollmentExist = await this.enrollmentRepo.exists({ student: id }); // or { user: id } depending on your schema field
        if (enrollmentExist) {
            throw new AppError(
                ERROR_CODES.USER_IN_USE,
                `Cannot delete "${userDoc.name}" because they have active academic program enrollments. Please unenroll or graduate the student first.`
            );
        }

        // 3. Check for research publication history
        const publicationExist = await this.publicationRepo.exists({ author: id }); // adjusted field to match typical publication schemas
        if (publicationExist) {
            throw new AppError(
                ERROR_CODES.USER_IN_USE,
                `Cannot delete "${userDoc.name}" because they are listed as an author on active research publications. Please reassign authorship or archive the publication records first.`
            );
        }

        // 1. Check for Project Applications
        const projectExists = await this.projectRepo.exists({ applicant: id });
        if (projectExists) {
            throw new AppError(
                ERROR_CODES.USER_IN_USE,
                "Cannot delete this user because they are the primary applicant on existing research projects. Please transfer or archive those projects first."
            );
        }

        // 2. Check for Project Collaborations
        const collabExist = await this.collabRepo.exists({ applicant: id });
        if (collabExist) {
            throw new AppError(
                ERROR_CODES.USER_IN_USE,
                "Cannot delete this user because they are assigned as a collaborator on active projects. Please remove them from those project teams first."
            );
        }

        // 3. Check for Reviewer Assignments
        const revExist = await this.reviewerRepo.exist({ reviewer: id });
        if (revExist) {
            throw new AppError(
                ERROR_CODES.USER_IN_USE,
                "Cannot delete this user because they are registered as an active reviewer for project proposals. Please reassign or remove their reviewer assignments first."
            );
        }

        const deleted = await this.repo.delete(id);
        if (!deleted) throw new Error(ERROR_CODES.USER_NOT_FOUND);
        return deleted;
    }
}
