

export interface ProjectComponentDto {
    title: string;
    description?: string;
    contributors: string[];
}

export interface CreateProjectComponentDTO extends ProjectComponentDto {
    project: string;
}

export interface UpdateProjectComponentDTO {
    title?: string;
    description?: string;
    contributors?: string[];
    //investigator?: ObjectIdInput;
}

export interface FilterProjectComponents {
    project?: string;
    title?: string;
    description?: string;
    contributors?: string[];
    //investigator?: ObjectIdInput;
}
