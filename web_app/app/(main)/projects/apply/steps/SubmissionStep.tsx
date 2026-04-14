'use client';
import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { Project } from '../../models/project.model';
import { ProjectApi } from '../../api/project.api';

interface SubmissionStepProps {
    data: Partial<Project>;
    onBack: () => void;
    onComplete: (project: any) => void;
}

export const SubmissionStep = ({ data, onBack, onComplete }: SubmissionStepProps) => {
    const [loading, setLoading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

    // Handle File Selection/Upload
    const onTemplateUpload = (e: FileUploadHandlerEvent) => {
        // Here you would typically upload to a storage service (S3/Multer)
        // and get back a URL. For now, we simulate adding to the local list.
        const files = e.files;
        setUploadedFiles(prev => [...prev, ...files]);
    };

    const submitFinalProject = async () => {
        setLoading(true);
        try {
            // Prepare final payload
            const finalPayload = {
                ...data,
                status: 'submitted', // Or your initial status
                // documents: uploadedFiles.map(f => f.name) // Map to your schema
            };

            // Call your API
            //const result = await ProjectApi.create(finalPayload);
            
            //onComplete(result);
        } catch (err) {
            console.error("Submission failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4">
            <div className="text-center mb-5">
                <i className="pi pi-cloud-upload text-primary text-6xl mb-3"></i>
                <h3 className="m-0 text-900">Finalize & Submit</h3>
                <p className="text-600">Please upload your technical proposal and supporting documents.</p>
            </div>

            <div className="card shadow-1 border-round-lg p-4 bg-gray-50 mb-4">
                <label className="block font-bold mb-3">Supporting Documents (PDF, max 10MB)</label>
                <FileUpload 
                    name="documents" 
                    multiple 
                    accept="application/pdf" 
                    maxFileSize={10000000}
                    customUpload
                    uploadHandler={onTemplateUpload}
                    auto
                    chooseLabel="Select Files"
                    emptyTemplate={<p className="m-0 text-500 text-center py-4">Drag and drop files here to upload.</p>}
                />
            </div>

            <div className="surface-100 p-4 border-round-lg border-left-3 border-primary mb-4">
                <h5 className="mt-0 mb-2">Review Summary</h5>
                <div className="grid text-sm">
                    <div className="col-12 md:col-6">
                        <span className="text-600">Total Budget:</span>
                        <span className="ml-2 font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalBudget || 0)}</span>
                    </div>
                    <div className="col-12 md:col-6">
                        <span className="text-600">Collaborators:</span>
                        <span className="ml-2 font-bold">{data.collaborators?.length || 0} Members</span>
                    </div>
                    <div className="col-12">
                        <span className="text-600">Project Title:</span>
                        <p className="m-0 mt-1 font-medium">{data.title}</p>
                    </div>
                </div>
            </div>

            <Message 
                severity="info" 
                text="By clicking submit, your proposal will be locked and sent for review." 
                className="w-full mb-4" 
            />

            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button 
                    label="Review Team" 
                    icon="pi pi-chevron-left" 
                    onClick={onBack} 
                    className="p-button-text p-button-secondary"
                    disabled={loading}
                />
                <Button 
                    label={loading ? 'Submitting...' : 'Submit Application'} 
                    icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-send'} 
                    onClick={submitFinalProject} 
                    className="p-button-success px-6 shadow-3"
                    loading={loading}
                />
            </div>
        </div>
    );
};