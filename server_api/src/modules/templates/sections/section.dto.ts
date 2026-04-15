import { CreateFieldDTO, UpdateFieldDTO } from "../fields/field.dto";

export interface CreateSectionDTO {
    title: string;
    description?: string;
    order: number;
    isRequired?: boolean;
    fields: CreateFieldDTO[];
}

export interface UpdateSectionDTO {
    _id?: string; // required for update, optional for new
    title?: string;
    description?: string;
    order?: number;
    isRequired?: boolean;
    fields?: UpdateFieldDTO[];
}