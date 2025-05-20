import { ResponseType, Weight } from "./weight";

export type CriterionOption = {
    _id?: string;
    weight: string | Weight;
    label: string;
    value: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export const validateCriterionOption = (option: CriterionOption): { valid: boolean; message?: string } => {
    if (!option.weight) {
        return { valid: false, message: 'Weight reference is required.' };
    }

    if (typeof option.weight === 'string') {
        return { valid: false, message: 'Weight object must be populated to validate.' };
    }

    const weight = option.weight as Weight;

    if (weight.response_type !== ResponseType.Closed) {
        return { valid: false, message: 'Criterion options are only allowed for weights with response type "Closed".' };
    }

    if (!option.label || option.label.trim().length === 0) {
        return { valid: false, message: 'Label is required.' };
    }

    if (typeof option.value !== 'number' || option.value < 0) {
        return { valid: false, message: 'Value must be a non-negative number.' };
    }

    if (option.value >= weight.weight_value) {
        return {
            valid: false,
            message: `Option value (${option.value}) must be less than the weight's max value (${weight.weight_value}).`
        };
    }

    return { valid: true };
};
