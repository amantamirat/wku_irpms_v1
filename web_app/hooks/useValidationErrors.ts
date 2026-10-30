import { useCallback, useState } from 'react';
import { ERROR_CODES } from '@/api/error.codes';

export interface SectionValidationResult {
    name: string;
    found: boolean;
    passed: boolean;
    wordCount: number;
    issues: string[];
}

export interface TemplateValidationResult {
    valid: boolean;
    score: number;
    pages: number;
    issues: string[];
    sections: SectionValidationResult[];
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}


export const useValidationErrors = () => {
    const [error, setError] = useState<string | null>(null);
    const [templateValidation, setTemplateValidation] = useState<TemplateValidationResult | null>(null);
    const [constraintValidation, setConstraintValidation] = useState<ValidationResult | null>(null);

    const clearErrors = useCallback(() => {
        setError(null);
        setTemplateValidation(null);
        setConstraintValidation(null);
    }, []);

    const handleError = useCallback((err: any) => {
        clearErrors();

        const code = err?.code;
        const details = err?.details;

        if (code === ERROR_CODES.INVALID_CONSTRAINT || code === ERROR_CODES.INVALID_COMPOSITION) {
            setConstraintValidation(details as ValidationResult);
        } else if (code === ERROR_CODES.INVALID_DOCUMENT || details?.sections) {
            setTemplateValidation(details as TemplateValidationResult);
        } else if (Array.isArray(details?.errors)) {
            setConstraintValidation(details as ValidationResult);
        } else {
            setError(err?.message || 'Submission failed. Please try again.');
        }
    }, [clearErrors]);

    return { error, templateValidation, constraintValidation, handleError, clearErrors };
};