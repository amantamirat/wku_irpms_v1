import mongoose from "mongoose";
import { PhaseActivityDto } from "./activities/phase-activity.dto";
import { PhaseActivityType } from "./activities/phase-activity.model";
import { CollaboratorDto } from "./collaborators/collaborator.dto";
import { ProjectComponentDto } from "./components/component.dto";
import { EquipmentDto } from "./equipments/phase-equipment.dto";
import { PhaseDto } from "./phase/phase.dto";
import { IProjectObjectives, ProjectStatus } from "./project.model";

interface ProjectActivityDto extends PhaseActivityDto {
    kind: PhaseActivityType;
    details: any;
}


export interface CreateProjectDto {
    grant: string;
    calendar: string;
    leadPI?: string;

    call?: string;

    title: string;
    objectives?: IProjectObjectives;
    summary?: string;

    themes: string[];
    keywords?: string[];

    totalBudget: number;
    totalDuration: number;
}

export interface UpdateProjectDTO
    extends Partial<Omit<CreateProjectDto, 'grant' | 'calendar' | 'call' | 'leadPI'>> { }


export interface ApplyProjectDto extends Partial<Omit<CreateProjectDto, 'grant' | 'calendar' | 'call' | 'leadPI'>> {
    collaborators?: CollaboratorDto[];
    phases?: PhaseDto[];
    components?: ProjectComponentDto[];
    activities?: ProjectActivityDto[];
    equipments?: EquipmentDto[];
}

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




//////////////////////older dtos/////




export interface ApplyProjectDTO {

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

export interface InternalCreateProjectDto extends ApplyProjectDTO {
    leadPI: string;
    grant: string;
    calendar: string;
    organization: string;
    call?: string;
}




///old////
export interface CreateOLDProjectDTO {
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



