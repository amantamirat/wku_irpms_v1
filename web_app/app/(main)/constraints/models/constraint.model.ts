import { IRange } from '@/types/range';

/* ---------- Grouped constraints (mirrors the backend model) ---------- */

export interface IProjectConstraints {
    // Text length
    titleWords?: IRange;
    summaryWords?: IRange;
    keyWords?: IRange;

    // Objectives
    generalObjectiveWords?: IRange;
    specificObjectiveWords?: IRange;
    specificObjectives?: IRange;

    // Expected outputs
    expectedOutputs?: IRange;
    expectedOutputWords?: IRange;

    // Budget & time
    budget?: IRange;
    duration?: IRange;

    // Classification
    themes?: IRange;
}

export interface ICollaboratorConstraints {
    members?: IRange; // was participants
}

export interface IPhaseConstraints {
    phases?: IRange; // number of phases
    budget?: IRange; // was phaseBudget
    duration?: IRange; // was phaseDuration
}

export interface IActivityConstraints {
    activities?: IRange; // number of activities
    cost?: IRange; // was activityCost
    duration?: IRange; // was activityDuration
}

export interface IEquipmentConstraints {
    equipments?: IRange; // number of equipments
    cost?: IRange; // was equipmentCost
}

export interface IComponentConstraints {
    components?: IRange; // number of components
    collaborators?: IRange; // was componentCollaborators
}

/* ---------- Constraint ---------- */

export interface Constraint {
    _id?: string;

    name: string;
    description?: string;

    projectConstraints?: IProjectConstraints;
    collaboratorConstraints?: ICollaboratorConstraints;
    phaseConstraints?: IPhaseConstraints;
    activityConstraints?: IActivityConstraints;
    equipmentConstraints?: IEquipmentConstraints;
    componentConstraints?: IComponentConstraints;

    createdAt?: string | Date;
    updatedAt?: string | Date;
}