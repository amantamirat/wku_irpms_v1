'use client';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { useState } from 'react';
import { ApplicationApi } from '../../api/application.api';
import { Project } from '../../../projects/models/project.model';

// Document/Template Validation Interfaces
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

// Backend Grant Constraint Validation Interface
export interface ConstraintValidationResult {
    valid: boolean;
    errors: string[];
}

interface SubmissionStepProps {
    data: Partial<Project>;
    onBack: () => void;
    onComplete: (project: any) => void;
}

export const SubmissionStep = ({ data, onBack, onComplete }: SubmissionStepProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Error States
    const [error, setError] = useState<string | null>(null);
    const [validationDetails, setValidationDetails] = useState<TemplateValidationResult | null>(null);
    const [constraintDetails, setConstraintDetails] = useState<ConstraintValidationResult | null>(null);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const clearErrors = () => {
        setError(null);
        setValidationDetails(null);
        setConstraintDetails(null);
    };

    const onFileSelect = (e: FileUploadSelectEvent) => {
        const file = e.files[0];
        setSelectedFile(file);
        clearErrors();
    };

    const onFileRemove = () => {
        setSelectedFile(null);
        clearErrors();
    };

    const submitFinalApplication = async () => {
        if (!selectedFile) return;

        setLoading(true);
        clearErrors();

        try {
            const result = await ApplicationApi.apply({
                ...data,
                file: selectedFile,
            });

            setLoading(false);
            setSuccess(true);

            setTimeout(() => {
                onComplete(result);
                router.push('/');
            }, 2000);

        } catch (err: any) {
            setLoading(false);
            setSuccess(false);

            // 1. Capture Template/PDF Section Validation Errors
            if (err?.details?.sections) {
                setValidationDetails(err.details as TemplateValidationResult);
                setError("Document validation failed. Please address the issues listed below.");
            } 
            // 2. Capture Grant Constraint Validation Errors
            else if (err?.details?.errors && Array.isArray(err.details.errors)) {
                setConstraintDetails(err.details as ConstraintValidationResult);
                setError(err?.message || "Grant constraint validation failed.");
            } 
            // 3. Generic Error Handling
            else {
                setError(err?.message || "Submission failed. Please try again later.");
            }

            console.error("Submission failed", err);
        }
    };

    return (
        <div className="mt-4">
            <div className="text-center mb-5">
                <i className={`pi ${success ? 'pi-check-circle text-green-500' : 'pi-file-pdf text-primary'} text-6xl mb-3 transition-all duration-500`}></i>
                <h3 className="m-0 text-900">{success ? 'All Set!' : 'Finalize & Submit'}</h3>
                <p className="text-600">
                    {success ? 'Your application has been received.' : 'Please upload your technical proposal (Single PDF).'}
                </p>
            </div>

            {/* FEEDBACK MESSAGES & VALIDATION REPORT */}
            <div className="mb-4">
                {success && (
                    <Message
                        severity="success"
                        className="w-full shadow-2"
                        content={(
                            <div className="flex align-items-center p-2">
                                <i className="pi pi-verified mr-3 text-2xl"></i>
                                <div>
                                    <div className="font-bold">Project Submitted Successfully</div>
                                    <small>Redirecting to your dashboard in a moment...</small>
                                </div>
                            </div>
                        )}
                    />
                )}

                {/* Generic Error Message (Only when detailed UI blocks are absent) */}
                {error && !validationDetails && !constraintDetails && (
                    <Message severity="error" text={error} className="w-full shadow-2" />
                )}

                {/* Constraint Validation Failure Display */}
                {constraintDetails && (
                    <div className="surface-card border-left-3 border-orange-500 shadow-2 p-4 border-round-lg mb-3">
                        <div className="flex align-items-center text-orange-700 font-bold text-lg mb-2">
                            <i className="pi pi-shield mr-2 text-xl"></i>
                            Call Requirement Check Failed
                        </div>
                        <p className="text-700 text-sm mt-0 mb-3">
                            Your application submission does not satisfy all call guidelines/constraints:
                        </p>
                        <div className="bg-orange-50 p-3 border-round border-1 border-orange-200">
                            <ul className="m-0 pl-3 text-sm text-orange-900">
                                {constraintDetails.errors.map((errItem, idx) => (
                                    <li key={idx} className="mb-1 font-medium">{errItem}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Structured Document Validation Failure Display */}
                {validationDetails && (
                    <div className="surface-card border-left-3 border-red-500 shadow-2 p-4 border-round-lg">
                        <div className="flex align-items-center text-red-700 font-bold text-lg mb-2">
                            <i className="pi pi-exclamation-triangle mr-2 text-xl"></i>
                            Document Validation Failed
                        </div>
                        <p className="text-700 text-sm mt-0 mb-3">
                            Your document does not meet the template requirements (Score: <strong>{validationDetails.score}%</strong>). Please update the PDF and re-upload.
                        </p>

                        {/* Top-Level Document Issues */}
                        {validationDetails.issues?.length > 0 && (
                            <div className="mb-3 bg-red-50 p-3 border-round border-1 border-red-200">
                                <span className="font-semibold text-red-800 text-xs uppercase block mb-1">General Issues:</span>
                                <ul className="m-0 pl-3 text-sm text-red-700">
                                    {validationDetails.issues.map((issue, idx) => (
                                        <li key={idx} className="mb-1">{issue}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Section-by-Section Breakdowns */}
                        <div className="surface-50 p-3 border-round border-1 border-200">
                            <span className="font-semibold text-800 text-xs uppercase block mb-2">Section Breakdown:</span>
                            <div className="flex flex-column gap-2">
                                {validationDetails.sections.map((section, idx) => (
                                    <div key={idx} className="bg-white p-2 border-round border-1 border-300">
                                        <div className="flex align-items-center justify-content-between">
                                            <div className="flex align-items-center">
                                                <i className={`pi ${section.passed ? 'pi-check-circle text-green-500' : 'pi-times-circle text-red-500'} mr-2`}></i>
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

            <div className={`card shadow-1 border-round-lg p-4 bg-gray-50 mb-4 transition-all ${success ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="block font-bold mb-3 italic text-primary">
                    <i className="pi pi-info-circle mr-2"></i>
                    Technical Document (Required)
                </label>

                <FileUpload
                    mode="advanced"
                    name="projectFile"
                    accept="application/pdf"
                    maxFileSize={10000000} // 10MB
                    multiple={false}
                    customUpload
                    auto={false}
                    onSelect={onFileSelect}
                    onRemove={onFileRemove}
                    onClear={onFileRemove}
                    chooseLabel={selectedFile ? "Change PDF" : "Select PDF"}
                    uploadOptions={{ style: { display: 'none' } }}
                    disabled={loading || success}
                    emptyTemplate={
                        <div className="flex flex-column align-items-center">
                            <i className="pi pi-upload mt-3 p-5 border-2 border-dashed border-300 border-circle text-400"></i>
                            <span className="my-3 text-600">Drag and drop the application document PDF here.</span>
                        </div>
                    }
                />
            </div>

            {/* Review Summary Section */}
            <div className="surface-100 p-4 border-round-lg border-left-3 border-primary mb-4">
                <h5 className="mt-0 mb-3 text-800">Review Summary</h5>
                <div className="grid text-sm">
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Total Budget:</span>
                        <span className="font-bold text-base">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'ETB'
                            }).format(Number(data.totalBudget) || 0)}
                        </span>
                    </div>
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Project Timeline:</span>
                        <span className="font-bold text-base">
                            {(data as any).totalDuration || 0} Days
                        </span>
                    </div>
                    <div className="col-12 py-2">
                        <span className="text-600 block">Attached File:</span>
                        <span className={`font-medium ${selectedFile ? 'text-green-600' : 'text-red-500'}`}>
                            {selectedFile ? `✓ ${selectedFile.name}` : '❌ No file selected'}
                        </span>
                    </div>
                </div>
            </div>

            {!success && (
                <Message
                    severity="warn"
                    text="Confirm all information is correct. You cannot edit the project after submission."
                    className="w-full mb-4"
                />
            )}

            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button
                    label="Back to Team"
                    icon="pi pi-chevron-left"
                    onClick={onBack}
                    className="p-button-text p-button-secondary"
                    disabled={loading || success}
                />
                <Button
                    label={success ? 'Finalizing...' : loading ? 'Uploading Proposal...' : 'Submit Final Application'}
                    icon={(loading || success) ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'}
                    onClick={submitFinalApplication}
                    className={`px-6 shadow-3 transition-all duration-500 ${
                        success
                            ? 'p-button-info opacity-100'
                            : 'p-button-success'
                    }`}
                    disabled={!selectedFile || loading || success}
                />
            </div>
        </div>
    );
};