import { ProjectComponentStatus } from "./component.model";


export interface ProjectComponentDto {
    title: string;
    description?: string;
    contributors: string[];
    activities: string[];
    themes: string[];
}

export interface CreateProjectComponentDTO extends ProjectComponentDto {
    project: string;
}

// `project` is immutable in the schema, so it is intentionally not updatable
export interface UpdateProjectComponentDTO extends Partial<ProjectComponentDto> { }



export interface FilterProjectComponents {
    project?: string;
    title?: string;
    description?: string;
    status?: ProjectComponentStatus;
    contributor?: string;
    activity?: string;
    theme?: string;
    activities?: string[];
    excludeId?: string;
}