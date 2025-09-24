import mongoose, { Schema } from "mongoose";
import { AssignmentType, CollaboratorRole } from "./assignment.enum";
import { COLLECTIONS } from "../../../../enums/collections.enum";

export interface ICollaboratorAssignment extends Document {
    collaborator: mongoose.Types.ObjectId;
    role: CollaboratorRole;
    assignmentType: AssignmentType;
    assignmentId?: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const CollaboratorAssignmentSchema = new Schema<ICollaboratorAssignment>(
    {
        collaborator: {
            type: Schema.Types.ObjectId,
            ref: COLLECTIONS.COLLABORATOR,
            required: true,
        },
        role: {
            type: String,
            enum: Object.values(CollaboratorRole),
            required: true,
        },
        assignmentType: {
            type: String,
            enum: Object.values(AssignmentType),
            required: true,
        },
        assignmentId: {
            type: Schema.Types.ObjectId,
            required: function () {
                return this.assignmentType !== AssignmentType.PROJECT;
            },
            refPath: "assignmentType",
        },
    },
    { timestamps: true }
);
export const Assignment = mongoose.model<ICollaboratorAssignment>(COLLECTIONS.COLLABORATOR_ASSIGNMENT,  CollaboratorAssignmentSchema);