import { Stage } from "./stage";

export enum ResponseType {
    Open = 'Open',
    Closed = 'Closed'
}

export type Weight = {
    _id?: string;
    stage: string | Stage;
    title: string;
    weight_value: number;
    response_type: ResponseType;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateWeight = (weight: Weight): { valid: boolean; message?: string } => {

    if (!weight.stage) {
        return { valid: false, message: 'Stage is required.' };
    }

    if (!weight.title || weight.title.trim().length === 0) {
        return { valid: false, message: 'Title is required.' };
    }

    if (weight.weight_value == null || weight.weight_value <= 0) {
        return { valid: false, message: 'Weight value must be greater than 0 and not null.' };
    }

    return { valid: true };
};