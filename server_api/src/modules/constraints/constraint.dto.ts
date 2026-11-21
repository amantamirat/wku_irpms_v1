import {
    IActivityConstraints,
    ICollaboratorConstraints,
    IComponentConstraints,
    IEquipmentConstraints,
    IPhaseConstraints,
    IProjectConstraints,
} from "./constraint.model";

/**
 * Create Constraint
 */
export interface CreateConstraintDTO {
    name: string;
    description?: string;

    projectConstraints?: IProjectConstraints;
    collaboratorConstraints?: ICollaboratorConstraints;
    phaseConstraints?: IPhaseConstraints;
    activityConstraints?: IActivityConstraints;
    equipmentConstraints?: IEquipmentConstraints;
    componentConstraints?: IComponentConstraints;
}

/**
 * Update Constraint
 */
export interface UpdateConstraintDTO {
    id: string;
    data: Partial<CreateConstraintDTO>;
}