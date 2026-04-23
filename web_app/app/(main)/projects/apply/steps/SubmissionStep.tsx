'use client';
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Project } from '../../models/project.model';
import { ProjectApi } from '../../api/project.api';

interface SubmissionStepProps {
    data: Partial<Project>;
    onBack: () => void;
    onComplete: (project: any) => void;
}

export const SubmissionStep = ({ data, onBack, onComplete }: SubmissionStepProps) => {
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Handle File Selection
    const onFileSelect = (e: FileUploadSelectEvent) => {
        // Since multiple={false}, we take the first file
        const file = e.files[0];
        setSelectedFile(file);
    };

    const onFileRemove = () => {
        setSelectedFile(null);
    };

    const submitFinalProject = async () => {
        if (!selectedFile) return;

        setLoading(true);
        try {
            const result = await ProjectApi.apply({
                ...data,
                file: selectedFile, // The raw File object from state
            });
            onComplete(result);
        } catch (err) {
            console.error("Submission failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4">
            <div className="text-center mb-5">
                <i className="pi pi-file-pdf text-primary text-6xl mb-3"></i>
                <h3 className="m-0 text-900">Finalize & Submit</h3>
                <p className="text-600">Please upload your technical proposal (Single PDF).</p>
            </div>

            <div className="card shadow-1 border-round-lg p-4 bg-gray-50 mb-4">
                <label className="block font-bold mb-3 italic text-primary">
                    <i className="pi pi-info-circle mr-2"></i>
                    Technical Document (Required)
                </label>

                <FileUpload
                    mode="advanced"
                    name="projectFile"
                    accept="application/pdf"
                    maxFileSize={10000000} // 10MB
                    multiple={false} // Restrict to single file
                    customUpload
                    auto={false}
                    onSelect={onFileSelect}
                    onRemove={onFileRemove}
                    onClear={onFileRemove}
                    chooseLabel="Select PDF"
                    uploadOptions={{ style: { display: 'none' } }} // Hide default upload button
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
                    {/* 1. Total Budget */}
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Total Budget:</span>
                        <span className="font-bold text-base">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'ETB'
                            }).format(Number(data.totalBudget) || 0)}
                        </span>
                    </div>

                    {/* 2. Project Timeline */}
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Project Timeline:</span>
                        <span className="font-bold text-base">
                            {(data as any).totalDuration || 0} Days
                        </span>
                    </div>

                    {/* 3. Project Title */}
                    <div className="col-12 py-2">
                        <span className="text-600 block">Project Title:</span>
                        <p className="m-0 font-medium text-900">{data.title || 'Untitled Project'}</p>
                    </div>

                    {/* 4. File Status */}
                    <div className="col-12 py-2">
                        <span className="text-600 block">Attached File:</span>
                        <span className={`font-medium ${selectedFile ? 'text-green-600' : 'text-red-500'}`}>
                            {selectedFile ? `✓ ${selectedFile.name}` : '❌ No file selected'}
                        </span>
                    </div>
                </div>
            </div>

            <Message
                severity="warn"
                text="Confirm all information is correct. You cannot edit the project after submission."
                className="w-full mb-4"
            />

            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button
                    label="Back to Team"
                    icon="pi pi-chevron-left"
                    onClick={onBack}
                    className="p-button-text p-button-secondary"
                    disabled={loading}
                />
                <Button
                    label={loading ? 'Submitting...' : 'Submit Final Application'}
                    icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'}
                    onClick={submitFinalProject}
                    className="p-button-success px-6 shadow-3"
                    disabled={!selectedFile || loading}
                    loading={loading}
                />
            </div>
        </div>
    );
};