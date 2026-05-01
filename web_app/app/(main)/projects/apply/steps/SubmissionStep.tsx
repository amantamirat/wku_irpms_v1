'use client';
import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Project } from '../../models/project.model';
import { ProjectApi } from '../../api/project.api';
import { useRouter } from 'next/navigation'; // Using Next.js router

interface SubmissionStepProps {
    data: Partial<Project>;
    onBack: () => void;
    onComplete: (project: any) => void;
}

export const SubmissionStep = ({ data, onBack, onComplete }: SubmissionStepProps) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const onFileSelect = (e: FileUploadSelectEvent) => {
        const file = e.files[0];
        setSelectedFile(file);
        setError(null);
    };

    const onFileRemove = () => {
        setSelectedFile(null);
    };

    const submitFinalProject = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);

        try {
            const result = await ProjectApi.apply({
                ...data,
                file: selectedFile,
            });

            // 1. Stop loading and show success UI
            setLoading(false);
            setSuccess(true);

            // 2. Delayed Redirection (3 seconds)
            // This allows the user to actually read the success message
            setTimeout(() => {
                onComplete(result);
                router.push('/'); // Redirect to home
            }, 2000);

        } catch (err: any) {
            setLoading(false);
            setSuccess(false);
            setError(err?.message || "Submission failed. Please try again later.");
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

            {/* FEEDBACK MESSAGES */}
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
                {error && (
                    <Message severity="error" text={error} className="w-full shadow-2" />
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
                            <span className="my-3 text-600">Drag and drop the proposal PDF here.</span>
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
                    // Technical labeling: Shows the transition of the process
                    label={success ? 'Finalizing...' : loading ? 'Uploading Proposal...' : 'Submit Final Application'}

                    // Maintain the spinner for both loading and the redirect pause
                    icon={(loading || success) ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'}

                    onClick={submitFinalProject}

                    className={`px-6 shadow-3 transition-all duration-500 ${success
                            ? 'p-button-info opacity-100'
                            : 'p-button-success'
                        }`}

                    // Keeps the button locked so no double-submissions occur
                    disabled={!selectedFile || loading || success}
                />
            </div>
        </div>
    );
};