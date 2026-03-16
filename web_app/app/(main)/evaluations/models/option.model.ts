import { Criterion } from "./criterion.model";


export type Option = {
    _id?: string;
    criterion: string | Criterion;
    title: string;
    score: number;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface GetOptionsFilter {
    criterion?: string | Criterion;
}

export const validateOption = (
    option: Option
): { valid: boolean; message?: string } => {
    if (!option.title || option.title.trim().length === 0) {
        return { valid: false, message: "Title is required." };
    }
    if (option.score === undefined || option.score < 0) {
        return { valid: false, message: "Value must be a positive number." };
    }
    if (!option.criterion) {
        return { valid: false, message: "Criterion is required." };
    }
    return { valid: true };
};


export function sanitize(option: Partial<Option>): Partial<Option> {
    return {
        ...option,
        criterion:
            typeof option.criterion === 'object' && option.criterion !== null
                ? (option.criterion as Criterion)._id
                : option.criterion
    };
}

export const createEmptyOption = (option?: Partial<Option>): Option => ({
    criterion: option?.criterion ?? "",
    title: "",
    score: 0,
});