import { CreateSectionDTO, UpdateSectionDTO } from "./sections/section.dto";
import { TemplateStatus } from "./template.model";

export interface CreateTemplateDTO {
    name: string;
    description?: string;
    sections: CreateSectionDTO[];
    status?: TemplateStatus; // optional → default = draft
}


export interface UpdateTemplateDTO {
    id: string;
    data: Partial<{
        name: string;
        description: string;
        sections: UpdateSectionDTO[];
        status: TemplateStatus;
    }>;
}

export interface GetTemplatesDTO {
    status?: TemplateStatus;
    name?: string; // optional search/filter
}