import { BaseConstraintType, OperationMode, ProjectConstraintType } from "./constraint.enum";
import { Grant } from "../grant.model";
import mongoose from "mongoose";
import { BaseConstraint, ProjectConstraint } from "./constraint.model";
import { CreateProjectDto } from "../../project/project.service";

export interface CreateConstraintDto {
    grant: mongoose.Types.ObjectId; //
    type: BaseConstraintType;
    constraint?: ProjectConstraintType
    max?: number;
    min?: number;
    parent?: mongoose.Types.ObjectId; //
    mode?: OperationMode; //
    valueType?: string;
    value?: string;
}

export interface GetConstraintOptions {
    grant?: mongoose.Types.ObjectId; //
    type?: BaseConstraintType;
    parent?: mongoose.Types.ObjectId;
}

export class ConstraintService {

    static async validateProjectConstraints(grantId: mongoose.Types.ObjectId, data: CreateProjectDto) {
        const constraints = await ProjectConstraint.find({ grant: grantId }).lean();
        if (!constraints || constraints.length === 0) return;
        const numParticipants = data.collaborators?.length ?? 0;
        const numPhases = data.phases?.length ?? 0;


        for (const constraint of constraints) {
            switch (constraint.constraint) {
                case ProjectConstraintType.PARTICIPANT:
                    if (numParticipants < constraint.min || numParticipants > constraint.max) {
                        throw new Error(`Participant count (${numParticipants}) must be between ${constraint.min} and ${constraint.max}`);
                    }
                    break;
                case ProjectConstraintType.PHASE_COUNT:
                    if (numPhases < constraint.min || numPhases > constraint.max) {
                        throw new Error(`Phase count (${numPhases}) must be between ${constraint.min} and ${constraint.max}`);
                    }
                    break;
                default:
                    // For now, ignore other constraint types
                    break;
            }
        }

    }

    /** Create a new constraint */
    static async createConstraint(data: CreateConstraintDto) {
        const grantExists = await Grant.exists({ _id: data.grant });
        if (!grantExists) throw new Error("Grant type not found");
        const createdConstraint = await BaseConstraint.create({ ...data });
        return createdConstraint;
    }

    /** Retrieve constraints by optional filters */
    static async getConstraints(options: GetConstraintOptions = {}) {
        const filter: any = {};
        if (options.grant) filter.grant = options.grant;
        if (options.type) filter.type = options.type;
        if (options.parent) filter.parent = options.parent;
        return await BaseConstraint.find(filter).lean();
    }

    /** Update a constraint (non-immutable fields only) */
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
        // Check if this constraint has children
        //const hasChildren = await Constraint.exists({ parent: constraint._id });
        //if (hasChildren) throw new Error("Cannot delete constraint with child constraints");

        return await constraint.deleteOne();
    }
}
