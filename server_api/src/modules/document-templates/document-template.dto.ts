import {
    DocumentTemplateStatus,
    DocumentTemplateType,
    TemplateEngine,
    TemplateVariableType,
} from "./document-template.model";

export interface CreateDocumentTemplateDTO {
    name: string;
    description?: string;
    version?: number;
    type: DocumentTemplateType;
    engine?: TemplateEngine;
    filePath: string;
    variables?: ITemplateVariableDTO[];
}

export interface UpdateDocumentTemplateDTO {
    name?: string;
    description?: string;
    filePath?: string;
    variables?: ITemplateVariableDTO[];
}

export interface ITemplateVariableDTO {
    key: string;
    label: string;
    type: TemplateVariableType;
}

export interface FilterDocumentTemplateDTO {
    name?: string;
    type?: DocumentTemplateType;
    status?: DocumentTemplateStatus;
    version?: number;
}