import { TemplateValidationResult, ValidationResult } from '@/hooks/useValidationErrors';
import { Message } from 'primereact/message';


interface ValidationReportProps {
    error?: string | null;
    templateValidation?: TemplateValidationResult | null;
    validationResult?: ValidationResult | null;
}

export const ValidationReport = ({
    error,
    templateValidation,
    validationResult
}: ValidationReportProps) => {
    if (!error && !templateValidation && !validationResult) return null;

    return (
        <div className="mb-4">
            {error && !templateValidation && !validationResult && (
                <Message severity="error" text={error} className="w-full shadow-2" />
            )}

            {validationResult && (
                <div className="surface-card border-left-3 border-orange-500 shadow-2 p-4 border-round-lg mb-3">
                    <div className="flex align-items-center text-orange-700 font-bold text-lg mb-2">
                        <i className="pi pi-shield mr-2 text-xl"></i>
                        Requirement Check Failed
                    </div>
                    <p className="text-700 text-sm mt-0 mb-3">
                        Your application does not satisfy all guidelines/constraints:
                    </p>
                    <div className="bg-orange-50 p-3 border-round border-1 border-orange-200">
                        <ul className="m-0 pl-3 text-sm text-orange-900">
                            {validationResult.errors.map((errItem, idx) => (
                                <li key={idx} className="mb-1 font-medium">{errItem}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {templateValidation && (
                <div className="surface-card border-left-3 border-red-500 shadow-2 p-4 border-round-lg">
                    <div className="flex align-items-center text-red-700 font-bold text-lg mb-2">
                        <i className="pi pi-exclamation-triangle mr-2 text-xl"></i>
                        Document Validation Failed
                    </div>
                    <p className="text-700 text-sm mt-0 mb-3">
                        Your document does not meet the template requirements (Score:{' '}
                        <strong>{templateValidation.score}%</strong>). Please update the PDF and re-upload.
                    </p>

                    {templateValidation.issues?.length > 0 && (
                        <div className="mb-3 bg-red-50 p-3 border-round border-1 border-red-200">
                            <span className="font-semibold text-red-800 text-xs uppercase block mb-1">
                                General Issues:
                            </span>
                            <ul className="m-0 pl-3 text-sm text-red-700">
                                {templateValidation.issues.map((issue, idx) => (
                                    <li key={idx} className="mb-1">{issue}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="surface-50 p-3 border-round border-1 border-200">
                        <span className="font-semibold text-800 text-xs uppercase block mb-2">
                            Section Breakdown:
                        </span>
                        <div className="flex flex-column gap-2">
                            {templateValidation.sections.map((section, idx) => (
                                <div key={idx} className="bg-white p-2 border-round border-1 border-300">
                                    <div className="flex align-items-center justify-content-between">
                                        <div className="flex align-items-center">
                                            <i
                                                className={`pi ${section.passed
                                                    ? 'pi-check-circle text-green-500'
                                                    : 'pi-times-circle text-red-500'
                                                    } mr-2`}
                                            ></i>
                                            <span className="font-medium text-sm text-900">{section.name}</span>
                                        </div>
                                        <span className="text-xs text-500">{section.wordCount} words</span>
                                    </div>

                                    {section.issues.length > 0 && (
                                        <ul className="m-0 pt-2 pl-4 text-xs text-red-600">
                                            {section.issues.map((issue, iIdx) => (
                                                <li key={iIdx}>{issue}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};