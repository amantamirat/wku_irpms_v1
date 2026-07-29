export interface CreateTemplateSectionDTO {
    name: string;
    aliases?: string[];
    required?: boolean;
    minWords?: number;
    maxWords?: number;
    order?: number;
    guidelines?: string;
}

export interface CreateTemplateDTO {
    name: string;
    description?: string;
    minPages?: number;
    maxPages?: number;
    sections: CreateTemplateSectionDTO[];
}


export interface UpdateTemplateSectionDTO {
    name?: string;
    aliases?: string[];
    required?: boolean;
    minWords?: number;
    maxWords?: number;
    order?: number;
    guidelines?: string;
}

export interface UpdateTemplateDTO {
    name?: string;
    description?: string;
    minPages?: number;
    maxPages?: number;
    sections?: UpdateTemplateSectionDTO[];
}