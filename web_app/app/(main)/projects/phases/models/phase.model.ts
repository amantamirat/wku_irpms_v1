import { Project } from "../../models/project.model";

export enum PhaseType {
    phase = 'phase',
    breakdown = 'breakdown'
}


export type Phase = {
    _id?: string;
    type: PhaseType;
    project?: string | Project;    
    activity:string;
    order: number;
    duration: number;
    budget: number;
    description?: string;
    parent?: string | Phase;
    createdAt?: Date;
    updatedAt?: Date;
}