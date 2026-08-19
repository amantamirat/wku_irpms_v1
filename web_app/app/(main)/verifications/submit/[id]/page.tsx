'use client';

import { useAuth } from '@/contexts/auth-context';
import { useParams, useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { useEffect, useState } from 'react';
import { VerificationApi } from '../../api/verification.api';
import { VerificationConfigurationApi } from '../../verification-conf/api/verification-conf.api';
import { VerificationConfiguration } from '../../verification-conf/models/verification-conf.model';
import { Project, ProjectStatus } from '@/app/(main)/projects/models/project.model';
import { ProjectApi } from '@/app/(main)/projects/api/project.api';

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

export default function VerificationSubmitPage() {
    const params = useParams();
    const router = useRouter();
    const { getUser } = useAuth();
    const appUser = getUser();

    const configId = params?.id as string;

    // Data States
    const [config, setConfig] = useState<VerificationConfiguration | null>(null);
    const [eligibleProjects, setEligibleProjects] = useState<Project[]>([]);

    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Page Load & Dynamic Loading States
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Error States
    const [error, setError] = useState<string | null>(null);
    const [validationDetails, setValidationDetails] = useState<TemplateValidationResult | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            if (!configId) return;

            try {
                // 1. Fetch Verification Configuration Details
                const configData = await VerificationConfigurationApi.getById!(configId);
                setConfig(configData);

                // Extract Grant ID from config
                const targetGrantId = typeof configData.grant === 'object'
                    ? (configData.grant as any)?._id
                    : configData.grant;

                // 2. Fetch User Projects & Filter matching grant & COMPLETED status
                if (appUser?._id) {
                    const userProjects: Project[] = await ProjectApi.getAll({
                        leadPI: appUser, grant: targetGrantId
                    });

                    const filtered = userProjects.filter((proj: any) => {
                        //const projGrantId = typeof proj.grant === 'object' ? proj.grant?._id : proj.grant;
                        //const isSameGrant = projGrantId === targetGrantId;
                        const isCompleted = proj.status === ProjectStatus.completed;
                        return isCompleted;
                    });

                    setEligibleProjects(filtered);
                    if (filtered.length > 0) {
                        setSelectedProject(filtered[0]);
                    }
                }
            } catch (err: any) {
                console.error('Failed to load initial verification data', err);
                setError(err?.message || 'Failed to load verification details.');
            } finally {
                setInitialLoading(false);
            }
        };

        loadInitialData();
    }, [configId, appUser?._id]);

    const clearErrors = () => {
        setError(null);
        setValidationDetails(null);
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

    const submitVerification = async () => {
        if (!selectedFile || !selectedProject || !configId) return;

        setLoading(true);
        clearErrors();

        try {
            await VerificationApi.create({
                project: selectedProject._id,
                configuration: configId,
                document:selectedFile,
            });

            setLoading(false);
            setSuccess(true);

            setTimeout(() => {
                router.push('/verifications');
            }, 2000);

        } catch (err: any) {
            setLoading(false);
            setSuccess(false);

            if (err?.details?.sections) {
                setValidationDetails(err.details as TemplateValidationResult);
                setError("Document validation failed. Please address the issues listed below.");
            } else {
                setError(err?.message || "Submission failed. Please try again later.");
            }

            console.error("Verification submission failed", err);
        }
    };

    if (initialLoading) {
        return (
            <div className="card p-5 max-w-3xl mx-auto mt-5">
                <Skeleton width="100%" height="2rem" className="mb-3" />
                <Skeleton width="60%" height="1.5rem" className="mb-5" />
                <Skeleton width="100%" height="200px" />
            </div>
        );
    }

    return (
        <div className="card p-5 max-w-3xl mx-auto mt-4 surface-card border-round shadow-2">
            <div className="text-center mb-5">
                <i className={`pi ${success ? 'pi-check-circle text-green-500' : 'pi-shield text-primary'} text-6xl mb-3 transition-all duration-500`}></i>
                <h3 className="m-0 text-900">{success ? 'Verification Submitted!' : 'Submit Verification Request'}</h3>
                <p className="text-600">
                    {success ? 'Your verification document has been submitted successfully.' : 'Select your completed project and attach the required verification PDF.'}
                </p>
            </div>

            {/* Grant & Organization Info Header */}
            {config && (
                <div className="surface-100 p-3 border-round mb-4 flex align-items-center justify-content-between">
                    <div>
                        <span className="text-xs text-500 uppercase font-bold block">Grant</span>
                        <span className="font-semibold text-900">
                            {typeof config.grant === 'object' ? (config.grant as any)?.title : 'Grant'}
                        </span>
                    </div>
                    {typeof config.grant === 'object' && (config.grant as any)?.organization?.name && (
                        <div className="text-right">
                            <span className="text-xs text-500 uppercase font-bold block">Organization</span>
                            <span className="font-medium text-700">
                                {(config.grant as any)?.organization?.name}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ERROR FEEDBACK MESSAGES */}
            <div className="mb-4">
                {success && (
                    <Message
                        severity="success"
                        className="w-full shadow-2"
                        content={(
                            <div className="flex align-items-center p-2">
                                <i className="pi pi-verified mr-3 text-2xl"></i>
                                <div>
                                    <div className="font-bold">Verification Submitted</div>
                                    <small>Redirecting to dashboard...</small>
                                </div>
                            </div>
                        )}
                    />
                )}

                {error && !validationDetails && (
                    <Message severity="error" text={error} className="w-full shadow-2" />
                )}

                {validationDetails && (
                    <div className="surface-card border-left-3 border-red-500 shadow-2 p-4 border-round-lg">
                        <div className="flex align-items-center text-red-700 font-bold text-lg mb-2">
                            <i className="pi pi-exclamation-triangle mr-2 text-xl"></i>
                            Document Validation Failed
                        </div>
                        <p className="text-700 text-sm mt-0 mb-3">
                            Score: <strong>{validationDetails.score}%</strong>. Please update the document and re-upload.
                        </p>

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
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PROJECT SELECTION */}
            <div className="mb-4">
                <label className="block font-bold mb-2 text-900">
                    Select Completed Project
                </label>
                {eligibleProjects.length > 0 ? (
                    <Dropdown
                        value={selectedProject}
                        options={eligibleProjects}
                        onChange={(e) => setSelectedProject(e.value)}
                        optionLabel="title"
                        placeholder="Select a project"
                        className="w-full"
                        disabled={loading || success}
                    />
                ) : (
                    <Message
                        severity="warn"
                        className="w-full"
                        text="No completed projects found matching this grant verification."
                    />
                )}
            </div>

            {/* PDF FILE UPLOAD */}
            <div className={`card shadow-1 border-round-lg p-4 bg-gray-50 mb-4 transition-all ${success ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="block font-bold mb-3 italic text-primary">
                    <i className="pi pi-file-pdf mr-2"></i>
                    Verification Document PDF (Required)
                </label>

                <FileUpload
                    mode="advanced"
                    name="verificationFile"
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
                            <span className="my-3 text-600">Drag and drop the verification report PDF here.</span>
                        </div>
                    }
                />
            </div>

            {/* REVIEW SUMMARY */}
            <div className="surface-100 p-4 border-round-lg border-left-3 border-primary mb-4">
                <h5 className="mt-0 mb-3 text-800">Submission Details</h5>
                <div className="grid text-sm">
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Selected Project:</span>
                        <span className="font-bold text-base">
                            {selectedProject ? selectedProject.title : 'None Selected'}
                        </span>
                    </div>
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Attached Document:</span>
                        <span className={`font-medium ${selectedFile ? 'text-green-600' : 'text-red-500'}`}>
                            {selectedFile ? `✓ ${selectedFile.name}` : '❌ No file selected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* FORM FOOTER BUTTONS */}
            <div className="flex justify-content-between mt-6 pt-4 border-top-1 surface-border">
                <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={() => router.back()}
                    className="p-button-text p-button-secondary"
                    disabled={loading || success}
                />
                <Button
                    label={success ? 'Finalizing...' : loading ? 'Submitting...' : 'Submit Verification'}
                    icon={(loading || success) ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
                    onClick={submitVerification}
                    className={`px-6 shadow-3 transition-all duration-500 ${success ? 'p-button-info opacity-100' : 'p-button-success'}`}
                    disabled={!selectedFile || !selectedProject || loading || success}
                />
            </div>
        </div>
    );
}