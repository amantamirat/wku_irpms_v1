import { ConstraintRepository, IConstraintRepository } from "./constraint.repository";
import { CreateProjectConstraintDTO, UpdateProjectConstraintDTO } from "./project/project-constraint.dto";
import { CreateApplicantConstraintDTO } from "./applicant/applicant-constaint.dto";
import { ConstraintType } from "./constraint-type.enum";
import { GetConstraintOptions } from "./constraint.dto";


export class ConstraintService {

    private repository: IConstraintRepository;

    constructor(repository?: IConstraintRepository) {
        this.repository = repository || new ConstraintRepository();
    }
    //----------------------------------------
    // GET
    //----------------------------------------
    async getConstraints(options: GetConstraintOptions) {
        return await this.repository.find(options);
    }
    //----------------------------------------
    // PROJECT CONSTRAINTS
    //----------------------------------------
    async createProjectConstraint(dto: CreateProjectConstraintDTO) {
        return await this.repository.createProjectConstraint(dto);
    }

    //----------------------------------------
    // APPLICANT CONSTRAINTS
    //----------------------------------------
    async createApplicantConstraint(dto: CreateApplicantConstraintDTO) {
        return await this.repository.createApplicantConstraint(dto);
    }

    async updateProjectConstraint(dto: UpdateProjectConstraintDTO) {
        const existing = await this.repository.findById(dto.id);
        if (!existing) throw new Error("Constraint not found");

        if (existing.type !== ConstraintType.PROJECT) {
            throw new Error("Not a project constraint");
        }
        return await this.repository.updateProjectConstraint(dto);
    }

    //----------------------------------------
    // DELETE
    //----------------------------------------
    async deleteConstraint(id: string) {
        const existing = await this.repository.findById(id);
        if (!existing) throw new Error("Constraint not found");
        return await this.repository.delete(id);
    }
}
