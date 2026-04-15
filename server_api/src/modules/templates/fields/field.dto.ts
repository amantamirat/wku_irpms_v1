import { FieldType } from "./field.model";

export interface CreateFieldDTO {
    label: string;
    fieldType: FieldType;
    order: number;
    isRequired?: boolean;
    placeholder?: string;
}

export interface UpdateFieldDTO {
    _id?: string; // required for update
    label?: string;
    fieldType?: FieldType;
    order?: number;
    isRequired?: boolean;
    placeholder?: string;
}