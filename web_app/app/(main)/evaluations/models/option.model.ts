import { Criterion } from "./criterion.model";


export type Option = {
    _id?: string;
    criterion: string | Criterion;
    title: string;
    value: number;
    createdAt?: Date;
    updatedAt?: Date;
};

export const validateOption = (
    option: Option
): { valid: boolean; message?: string } => {
    if (!option.title || option.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (option.value === undefined || option.value < 0) {
        return { valid: false, message: "Value must be a positive number." };
    }
    if (!option.criterion) {
        return { valid: false, message: "Criterion is required." };
    }
    return { valid: true };
};
