import mongoose from "mongoose";
import { Assignment } from "./assignment.model";
import { CollaboratorRole, AssignmentType } from "./assignment.enum";

export interface GetAssignmentOptions {
    _id?: string;
    collaborator?: string;
    assignmentType?: AssignmentType;
    assignmentId?: string;
}

export interface CreateAssignmentDto {
    collaborator: mongoose.Types.ObjectId;
    role: CollaboratorRole;
    assignmentType: AssignmentType;
    assignmentId: mongoose.Types.ObjectId;
}

export interface UpdateAssignmentDto {
    role?: CollaboratorRole;
}

export class AssignmentService {


    static async createAssignment(data: CreateAssignmentDto) {
        const createdAssignment = await Assignment.create(data);
        return createdAssignment;
    }

    static async getAssignments(options: GetAssignmentOptions) {
        const filter: any = {};
        if (options.collaborator) filter.collaborator = options.collaborator;
        if (options.assignmentType) filter.assignmentType = options.assignmentType;
        const assignments = await Assignment.find(filter).populate("collaborator").lean();
        return assignments;
    }

    static async findAssignment(options: GetAssignmentOptions) {
        const filter: any = {};
        if (options._id) filter._id = options._id;
        if (options.collaborator) filter.collaborator = options.collaborator;
        return await Assignment.findOne(filter).lean();
    }

    static async updateAssignment(id: string, data: Partial<UpdateAssignmentDto>) {
        const assignment = await Assignment.findById(id);
        if (!assignment) throw new Error("Assignment not found");
        Object.assign(assignment, data);
        return assignment.save();
    }

    static async deleteAssignment(id: string) {
        const assignment = await Assignment.findById(id);
        if (!assignment) throw new Error("Assignment not found");
        return assignment.deleteOne();
    }
}
