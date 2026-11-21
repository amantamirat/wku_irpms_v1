// ApplyWizard/steps/SubmissionStep.tsx
'use client';

import { ValidationReport } from '@/components/ValidationErrorReport';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { extractId } from '@/utils/utils';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { useEffect, useRef, useState } from 'react';

import { Collaborator } from '../../../collaborators/models/collaborator.model';
import { Project } from '../../../models/project.model';

interface SubmissionStepProps {
    project: Partial<Project>;
    collaborators: Collaborator[];
    onBack: () => void;
    onSubmit: (project: Partial<Project>, files: File[]) => Promise<unknown>;
    onComplete?: () => void;
}

export const SubmissionStep = ({
    project,
    collaborators,
    onBack,
    onSubmit,
    onComplete
}: SubmissionStepProps) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { error, templateValidation, validationResult, handleError, clearErrors } =
        useValidationErrors();

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    const phases = project.phases ?? [];
    const totalBudget = phases.length
        ? phases.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
        : Number(project.totalBudget) || 0;

    const totalDuration = phases.length
        ? phases.reduce((sum, p) => sum + (Number(p.duration) || 0), 0)
        : Number((project as any).totalDuration) || 0;

    const onFileSelect = (e: FileUploadSelectEvent) => {
        setSelectedFile(e.files[0] ?? null);
        clearErrors();
        setLocalError(null);
    };

    const onFileRemove = () => {
        setSelectedFile(null);
        clearErrors();
    };

    const submitFinalApplication = async () => {
        if (!selectedFile) return;

        const callId = extractId(project.call);
        if (!callId) {
            setLocalError('No call selected for this application.');
            return;
        }

        setLoading(true);
        clearErrors();
        setLocalError(null);

        try {
            await onSubmit(
                {
                    ...project,
                    call: callId,
                    grant: undefined,
                    calendar: undefined,
                    themes: (project.themes ?? []).map((t) => extractId(t)),
                    collaborators: collaborators.map((c) => ({
                        member: extractId(c.member),
                        role: c.role,
                        isLeadPI: Boolean(c.isLeadPI)
                    }))
                } as unknown as Partial<Project>,   // themes/collaborators are ids here, not objects
                [selectedFile]
            );

            setSuccess(true);
            timer.current = setTimeout(() => onComplete?.(), 2000);
        } catch (err: any) {
            setSuccess(false);
            handleError(err);
            console.error('Submission failed', err);
        } finally {
            setLoading(false);
        }
    };

    const locked = loading || success;

    return (
        <div className="mt-4">
            <div className="text-center mb-5">
                <i
                    className={`pi ${success ? 'pi-check-circle text-green-500' : 'pi-file-pdf text-primary'} text-6xl mb-3 transition-all duration-500`}
                />
                <h3 className="m-0 text-900">{success ? 'All Set!' : 'Finalize & Submit'}</h3>
                <p className="text-600">
                    {success
                        ? 'Your application has been received.'
                        : 'Please upload your technical proposal (Single PDF).'}
                </p>
            </div>

            {success && (
                <Message
                    severity="success"
                    className="w-full shadow-2 mb-4"
                    content={
                        <div className="flex align-items-center p-2">
                            <i className="pi pi-verified mr-3 text-2xl" />
                            <div>
                                <div className="font-bold">Project Submitted Successfully</div>
                                <small>Redirecting to your dashboard in a moment...</small>
                            </div>
                        </div>
                    }
                />
            )}

            {localError && <Message severity="error" text={localError} className="w-full mb-4" />}

            <ValidationReport
                error={error}
                templateValidation={templateValidation}
                validationResult={validationResult}
            />

            <div className={`card shadow-1 border-round-lg p-4 bg-gray-50 mb-4 transition-all ${locked ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="block font-bold mb-3 italic text-primary">
                    <i className="pi pi-info-circle mr-2" />
                    Technical Document (Required)
                </label>

                <FileUpload
                    mode="advanced"
                    name="projectFile"
                    accept="application/pdf"
                    maxFileSize={10000000}
                    multiple={false}
                    customUpload
                    auto={false}
                    onSelect={onFileSelect}
                    onRemove={onFileRemove}
                    onClear={onFileRemove}
                    chooseLabel={selectedFile ? 'Change PDF' : 'Select PDF'}
                    uploadOptions={{ style: { display: 'none' } }}
                    disabled={locked}
                    emptyTemplate={
                        <div className="flex flex-column align-items-center">
                            <i className="pi pi-upload mt-3 p-5 border-2 border-dashed border-300 border-circle text-400" />
                            <span className="my-3 text-600">Drag and drop the application document PDF here.</span>
                        </div>
                    }
                />
            </div>

            <div className="surface-100 p-4 border-round-lg border-left-3 border-primary mb-4">
                <h5 className="mt-0 mb-3 text-800">Review Summary</h5>
                <div className="grid text-sm">
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Total Budget:</span>
                        <span className="font-bold text-base">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(totalBudget)}
                        </span>
                    </div>
                    <div className="col-12 md:col-6 py-2">
                        <span className="text-600 block">Project Timeline:</span>
                        <span className="font-bold text-base">{totalDuration} Days</span>
                    </div>
                    <div className="col-12 py-2">
                        <span className="text-600 block">Team ({collaborators.length}):</span>
                        <span className="font-medium">
                            {collaborators
                                .map((c) => `${(c.member as any)?.name ?? '—'} (${c.role})`)
                                .join(', ')}
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
                    type="button"
                    label="Back to Team"
                    icon="pi pi-chevron-left"
                    onClick={onBack}
                    className="p-button-text p-button-secondary"
                    disabled={locked}
                />
                <Button
                    type="button"
                    label={success ? 'Finalizing...' : loading ? 'Uploading Proposal...' : 'Submit Final Application'}
                    icon={locked ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'}
                    onClick={submitFinalApplication}
                    className={`px-6 shadow-3 transition-all duration-500 ${success ? 'p-button-info opacity-100' : 'p-button-success'}`}
                    disabled={!selectedFile || locked}
                />
            </div>
        </div>
    );
};

export default SubmissionStep;