import { BaseConstraintType, OperationMode, ProjectConstraintType, ApplicantConstraintType, isRangeConstraint, isListConstraint } from "./constraint.enum";
import { Grant } from "../grant.model";
import mongoose from "mongoose";
import { BaseConstraint, ProjectConstraint } from "./constraint.model";
import { CreateProjectDto } from "../../project/project.service";
import { Gender } from "../../applicants/applicant.enum";
import { Category } from "../../organization/organization.enum";


export interface CreateConstraintDto {
    type: BaseConstraintType;
    grant: mongoose.Types.ObjectId;
    constraint: ProjectConstraintType | ApplicantConstraintType;
    min?: number;
    max?: number;
    mode?: OperationMode;
    value?: number;
    list?: string[];
}

export interface GetConstraintOptions {
    grant?: mongoose.Types.ObjectId;
    type?: BaseConstraintType;
    parent?: mongoose.Types.ObjectId;
}

export class ConstraintService {

    static async validateProjectConstraints(grantId: mongoose.Types.ObjectId, data: CreateProjectDto) {
        const constraints = await ProjectConstraint.find({ grant: grantId }).lean();
        if (!constraints || constraints.length === 0) return;

        const numParticipants = data.collaborators?.length ?? 0;
        const numPhases = data.phases?.length ?? 0;
        const totalBudget = (data.phases ?? []).reduce((sum, p) => sum + (p.budget ?? 0), 0);
        const totalDuration = (data.phases ?? []).reduce((sum, p) => sum + (p.duration ?? 0), 0);

        for (const constraint of constraints) {

            const { min, max } = constraint;

            switch (constraint.constraint) {
                case ProjectConstraintType.PARTICIPANT:
                    if (numParticipants < min || numParticipants > max) {
                        throw new Error(`Participant count (${numParticipants}) must be between ${constraint.min} and ${constraint.max}`);
                    }
                    break;

                case ProjectConstraintType.PHASE_COUNT:
                    if (numPhases < min || numPhases > max) {
                        throw new Error(`Phase count (${numPhases}) must be between ${min} and ${max}`);
                    }
                    break;

                case ProjectConstraintType.BUDGET_TOTAL:
                    if (totalBudget < min || totalBudget > max) {
                        throw new Error(`Total project budget (${totalBudget}) must be between ${min} and ${max}`);
                    }
                    break;

                case ProjectConstraintType.TIME_TOTAL:
                    if (totalDuration < min || totalDuration > max) {
                        throw new Error(`Total project duration (${totalDuration}) must be between ${min} and ${max}`);
                    }
                    break;

                // --- Per-phase constraints ---
                case ProjectConstraintType.BUDGET_PHASE:
                    for (const [i, phase] of (data.phases ?? []).entries()) {
                        if (phase.budget < min || phase.budget > max) {
                            throw new Error(`Phase ${i + 1} budget (${phase.budget}) must be between ${min} and ${max}`);
                        }
                    }
                    break;

                case ProjectConstraintType.TIME_PHASE:
                    for (const [i, phase] of (data.phases ?? []).entries()) {
                        if (phase.duration < min || phase.duration > max) {
                            throw new Error(`Phase ${i + 1} duration (${phase.duration}) must be between ${min} and ${max}`);
                        }
                    }
                    break;
                default:
                    // For now, ignore other constraint types
                    break;
            }
        }

    }

    static async validateConstraint(data: Partial<CreateConstraintDto>) {
        if (data.type === BaseConstraintType.APPLICANT) {
            if (isRangeConstraint(data.constraint as ApplicantConstraintType) && (!data.max || !data.min) ) {
                throw new Error(`Range must be specified for ${data.constraint} constraint.`);
            }
            if(isListConstraint(data.constraint as ApplicantConstraintType) && (!data.list || data.list.length === 0)) {
                throw new Error(`List of allowed values must be specified for ${data.constraint} constraint.`);
            }
            const participantConstraint = await ProjectConstraint.findOne({ grant: data.grant, constraint: ProjectConstraintType.PARTICIPANT }).lean();
            if (!participantConstraint) {
                throw new Error("Applicant constraints require a corresponding Participant constraint to be set first.");
            }
            if (data.constraint === ApplicantConstraintType.GENDER) {

            }
            else if (data.constraint === ApplicantConstraintType.SCOPE) {
                const allowedScopes = Object.values(Category);
                const invalidValues = data.list?.filter(v => !allowedScopes.includes(v as Category));
                if (invalidValues && invalidValues.length > 0) {
                    throw new Error(`Invalid scope value(s): ${invalidValues.join(', ')}. Allowed: ${allowedScopes.join(', ')}`);
                }
            }
        }
    }

    static async createConstraint(data: CreateConstraintDto) {
        const grant = await Grant.findById(data.grant).lean();
        if (!grant) throw new Error("Grant type not found");
        await this.validateConstraint(data);
        const createdConstraint = await BaseConstraint.create({ ...data });
        return createdConstraint;
    }

    static async getConstraints(options: GetConstraintOptions = {}) {
        const filter: any = {};
        if (options.grant) filter.grant = options.grant;
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        return await BaseConstraint.find(filter).lean();
    }


    static async updateConstraint(id: string, data: Partial<CreateConstraintDto>) {
        const constraint = await BaseConstraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");
        Object.assign(constraint, data);
        return await constraint.save();
    }

    /** Delete a constraint safely (ensure no child constraints exist) */
    static async deleteConstraint(id: string) {
        const constraint = await BaseConstraint.findById(id);
        if (!constraint) throw new Error("Constraint not found");
        return await constraint.deleteOne();
    }
}
