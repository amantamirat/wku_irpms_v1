import mongoose from "mongoose";
import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { PhaseDto } from "./phase/phase.dto";
import { IProjectObjectives, ProjectStatus } from "./project.model";
import { ProjectComponentDto as ProjectComponentDto } from "./components/component.dto";
import { PhaseActivityDetailsPatch, PhaseActivityDto } from "./activities/phase-activity.dto";
import { PhaseActivityType } from "./activities/phase-activity.model";
import { EquipmentDto } from "./equipments/phase-equipment.dto";


export interface FilterProjectsDTO {
    id?: mongoose.Types.ObjectId;
    ids?: string[];

    grant?: string;
    grantIds?: string[];

    organization?: string;
    workspace?: string;

    calendar?: string;
    call?: string;

    leadPI?: string;

    title?: string;

    status?: ProjectStatus;
}


export interface UpdateProjectDTO {
    title?: string;
    summary?: string;
    themes?: string[];
    objectives?: IProjectObjectives;
    totalBudget?: number;
    totalDuration?: number;
}

interface ProjectActivityDto extends PhaseActivityDto {
    kind: PhaseActivityType;
    details: any;
}


export interface ApplyProjectDto {

    title: string;
    objectives?: IProjectObjectives;
    summary?: string;

    themes: string[];
    keywords?: string[];

    totalBudget: number;
    totalDuration: number;

    collaborators?: CollaboratorDto[];
    phases?: PhaseDto[];
    components?: ProjectComponentDto[];
    activities?: ProjectActivityDto[];
    equipments?: EquipmentDto[];
}

export interface InternalCreateProjectDto extends ApplyProjectDto {
    leadPI: string;
    grant: string;
    calendar: string;
    //workspace: string;
    organization: string;
    call?: string;
}




///old////
export interface CreateProjectDTO {
    grant: string;

    conceptNoteId?: string;

    title: string;
    summary?: string;

    leadPI: string;

    themes: string[];

    objectives?: IProjectObjectives;

    collaborators: CollaboratorDto[];
    phases?: PhaseDto[];
    components?: ProjectComponentDto[];
    activities?: ProjectActivityDto[];
    equipments?: EquipmentDto[];

    calendar?: string;
    call?: string;

    documentPath?: string;
}


