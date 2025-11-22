import { CreateApplicantConstraintDTO } from "./applicant/applicant-constaint.dto";
import { ApplicantConstraint } from "./applicant/applicant-constraint.model";
import { GetConstraintOptions } from "./constraint.dto";
import { Constraint, IConstraint } from "./constraint.model";
import { CreateProjectConstraintDTO, UpdateProjectConstraintDTO } from "./project/project-constraint.dto";
import { IProjectConstraint, ProjectConstraint } from "./project/project-constraint.model";

export interface IConstraintRepository {
    find(filters: GetConstraintOptions): Promise<IConstraint[]>;
    findById(id: string): Promise<IConstraint | null>;
    createProjectConstraint(dto: CreateProjectConstraintDTO): Promise<IProjectConstraint>;
    updateProjectConstraint(dto: UpdateProjectConstraintDTO): Promise<IProjectConstraint>;
    createApplicantConstraint(dto: CreateApplicantConstraintDTO): Promise<IConstraint>;
    delete(id: string): Promise<IConstraint | null>;
}


export class ConstraintRepository implements IConstraintRepository {

    async find(filters: GetConstraintOptions): Promise<IConstraint[]> {
        const query: any = {};

        if (filters.grantId) query.grant = filters.grantId;
        if (filters.type) query.type = filters.type;

        return Constraint.find(query).exec();
    }

    async findById(id: string): Promise<IConstraint | null> {
        return Constraint.findById(id).lean<IConstraint>().exec();
    }

    async createProjectConstraint(dto: CreateProjectConstraintDTO): Promise<IProjectConstraint> {
        const doc = new ProjectConstraint(dto);
        return await doc.save();
    }

    async updateProjectConstraint(dto: UpdateProjectConstraintDTO): Promise<IProjectConstraint> {
        const { id, data } = dto;

        const updated = await ProjectConstraint.findByIdAndUpdate(
            id,
            data,
            { new: true }
        ).exec();

        if (!updated) {
            throw new Error("Project constraint not found");
        }

        return updated;
    }

    async createApplicantConstraint(dto: CreateApplicantConstraintDTO): Promise<IConstraint> {
        const doc = new ApplicantConstraint(dto);
        return await doc.save();
    }

    async delete(id: string): Promise<IConstraint | null> {
        return await Constraint.findByIdAndDelete(id).exec();
    }
}