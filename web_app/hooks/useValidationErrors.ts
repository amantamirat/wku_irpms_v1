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
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    const clearErrors = useCallback(() => {
        setError(null);
        setTemplateValidation(null);
        setValidationResult(null);
    }, []);

    const handleError = useCallback((err: any) => {
        clearErrors();

        const code = err?.code;
        const details = err?.details;

        console.log(err);

        if (code === ERROR_CODES.INVALID_CONSTRAINT || code === ERROR_CODES.INVALID_COMPOSITION) {
            setValidationResult(details as ValidationResult);
        } else if (code === ERROR_CODES.INVALID_DOCUMENT || details?.sections) {
            setTemplateValidation(details as TemplateValidationResult);
        } else if (Array.isArray(details?.errors)) {
            setValidationResult(details as ValidationResult);
        } else {
            setError(err?.message || 'Submission failed. Please try again.');
        }
    }, [clearErrors]);

    return { error, templateValidation, validationResult, handleError, clearErrors };
};