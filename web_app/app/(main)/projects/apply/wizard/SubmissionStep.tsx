'use client';

import { ProjectApi } from '@/app/(main)/projects/api/project.api';

import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { useState } from 'react';
import { Project } from '../../models/project.model';
import { ValidationReport } from '@/components/ValidationErrorReport';



interface SubmissionStepProps {
    data: Partial<Project>;
    onBack: () => void;
    onComplete: (project: any) => void;
}

export const SubmissionStep = ({ data, onBack, onComplete }: SubmissionStepProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { error, templateValidation, constraintValidation, handleError, clearErrors } =
        useValidationErrors();

    // Automatically calculate total budget and total duration from project phases
    const totalBudget =
        data.phases && data.phases.length > 0
            ? data.phases.reduce((sum, phase) => sum + (Number(phase.budget) || 0), 0)
            : Number(data.totalBudget) || 0;

    const totalDuration =
        data.phases && data.phases.length > 0
            ? data.phases.reduce((sum, phase) => sum + (Number(phase.duration) || 0), 0)
            : Number((data as any).totalDuration) || 0;

    const onFileSelect = (e: FileUploadSelectEvent) => {
        setSelectedFile(e.files[0]);
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
            const result = await ProjectApi.apply({
                ...data,
                totalBudget,
                totalDuration,
                file: selectedFile
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
            handleError(err);
            console.error('Submission failed', err);
        }
    };

    return (
        <div className="mt-4">
            <div className="text-center mb-5">
                <i
                    className={`pi ${success ? 'pi-check-circle text-green-500' : 'pi-file-pdf text-primary'
                        } text-6xl mb-3 transition-all duration-500`}
                ></i>
                <h3 className="m-0 text-900">{success ? 'All Set!' : 'Finalize & Submit'}</h3>
                <p className="text-600">
                    {success
                        ? 'Your application has been received.'
                        : 'Please upload your technical proposal (Single PDF).'}
                </p>
            </div>

            {/* FEEDBACK MESSAGES & VALIDATION REPORT */}
            {success && (
                <Message
                    severity="success"
                    className="w-full shadow-2 mb-4"
                    content={
                        <div className="flex align-items-center p-2">
                            <i className="pi pi-verified mr-3 text-2xl"></i>
                            <div>
                                <div className="font-bold">Project Submitted Successfully</div>
                                <small>Redirecting to your dashboard in a moment...</small>
                            </div>
                        </div>
                    }
                />
            )}

            <ValidationReport
                error={error}
                templateValidation={templateValidation}
                constraintValidation={constraintValidation}
            />

            <div
                className={`card shadow-1 border-round-lg p-4 bg-gray-50 mb-4 transition-all ${success ? 'opacity-50 pointer-events-none' : ''
                    }`}
            >
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
                    chooseLabel={selectedFile ? 'Change PDF' : 'Select PDF'}
                    uploadOptions={{ style: { display: 'none' } }}
                    disabled={loading || success}
                    emptyTemplate={
                        <div className="flex flex-column align-items-center">
                            <i className="pi pi-upload mt-3 p-5 border-2 border-dashed border-300 border-circle text-400"></i>
                            <span className="my-3 text-600">
                                Drag and drop the application document PDF here.
                            </span>
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
                            }).format(totalBudget)}
                        </span>
                    </div>
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Project Timeline:</span>
                        <span className="font-bold text-base">{totalDuration} Days</span>
                    </div>
                    <div className="col-12 py-2">
                        <span className="text-600 block">Attached File:</span>
                        <span
                            className={`font-medium ${selectedFile ? 'text-green-600' : 'text-red-500'
                                }`}
                        >
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
                    label={
                        success
                            ? 'Finalizing...'
                            : loading
                                ? 'Uploading Proposal...'
                                : 'Submit Final Application'
                    }
                    icon={loading || success ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'}
                    onClick={submitFinalApplication}
                    className={`px-6 shadow-3 transition-all duration-500 ${success ? 'p-button-info opacity-100' : 'p-button-success'
                        }`}
                    disabled={!selectedFile || loading || success}
                />
            </div>
        </div>
    );
};