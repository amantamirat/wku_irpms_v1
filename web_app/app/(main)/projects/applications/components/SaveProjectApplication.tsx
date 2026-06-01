'use client';

import { BASE_URL } from '@/api/ApiClient';
import { GrantStage, StageCategory } from '@/app/(main)/grants/stages/models/grant.stage.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ProjectApplicationApi } from '../api/project.stage.api';
import { ProjectApplication, sanitizeProjectApplication, validateProjectApplication } from '../models/project.application.model';

const SaveProjectApplication = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<ProjectApplication>) => {
    const toast = useRef<Toast>(null);
    const [localStage, setLocalStage] = useState<Partial<ProjectApplication>>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Memoize the GrantStage object for easier access
    const stageInfo = useMemo(() => {
        const gs = localStage.grantStage;
        return (typeof gs === 'object' && gs !== null) ? (gs as GrantStage) : null;
    }, [localStage.grantStage]);

    useEffect(() => {
        if (visible) {
            setLocalStage({ ...item });
            setSubmitted(false);
        }
    }, [item, visible]);

    const onFileSelect = (e: FileUploadSelectEvent) => {
        if (e.files && e.files.length > 0) {
            setLocalStage((prev) => ({ ...prev, file: e.files[0] }));
        }
    };

    const saveStage = async () => {
        setSubmitted(true);
        const validation = validateProjectApplication(localStage);
        
        if (!validation.valid) {
            toast.current?.show({ severity: 'error', summary: 'Validation Failed', detail: validation.message });
            return;
        }

        try {
            setIsUploading(true);
            const payload = sanitizeProjectApplication(localStage);
            
            const saved = localStage._id 
                ? await ProjectApplicationApi.update(payload) 
                : await ProjectApplicationApi.create(payload as ProjectApplication);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Document submitted successfully' });
            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Submission Error', detail: err.message });
        } finally {
            setIsUploading(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} disabled={isUploading} />
            <Button 
                label={localStage._id ? "Update Submission" : "Complete Submission"} 
                icon="pi pi-cloud-upload" 
                onClick={saveStage} 
                severity="success" 
                loading={isUploading} 
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={
                    <div className="flex align-items-center gap-3">
                        <div className="border-circle bg-primary-50 p-2 flex align-items-center justify-content-center">
                            <i className="pi pi-send text-primary text-xl"></i>
                        </div>
                        <div className="flex flex-column">
                            <span className="font-bold text-xl">
                                {localStage._id ? 'Edit Submission' : (stageInfo?.name || 'New Submission')}
                            </span>
                            <small className="text-500 font-medium">Step {stageInfo?.order ?? 'N/A'} of the Grant Process</small>
                        </div>
                    </div>
                }
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="flex flex-column gap-3 mt-1">
                    
                    {/* Visual Indicators for the Stage */}
                    <div className="flex gap-2">
                        <div className="surface-100 p-2 border-round flex-1 flex flex-column align-items-center border-1 border-200">
                            <span className="text-xs text-500 uppercase font-bold mb-1">Process</span>
                            <Tag 
                                severity={stageInfo?.category === StageCategory.selection ? 'info' : 'success'} 
                                value={stageInfo?.category || 'General'} 
                            />
                        </div>
                        <div className="surface-100 p-2 border-round flex-1 flex flex-column align-items-center border-1 border-200">
                            <span className="text-xs text-500 uppercase font-bold mb-1">Min. Score</span>
                            <span className="text-lg font-bold text-primary">{stageInfo?.minAcceptanceScore ?? 0}</span>
                        </div>
                    </div>

                    <div className="field">
                        <label className="font-bold block mb-2">Technical Documentation</label>
                        
                        {/* File Preview if editing */}
                        {localStage.documentPath && !localStage.file && (
                            <div className="p-3 border-1 border-round border-300 surface-50 mb-3 flex align-items-center justify-content-between">
                                <div className="flex align-items-center">
                                    <i className="pi pi-file-pdf text-red-500 text-2xl mr-3"></i>
                                    <span className="text-sm font-medium">Existing Submission</span>
                                </div>
                                <Button 
                                    type="button" 
                                    icon="pi pi-external-link" 
                                    text 
                                    onClick={() => window.open(`${BASE_URL}/${localStage.documentPath?.replace(/^\\/, "")}`, '_blank')}
                                />
                            </div>
                        )}

                        <FileUpload
                            mode="basic"
                            name="file"
                            accept="application/pdf"
                            maxFileSize={15000000}
                            onSelect={onFileSelect}
                            auto={false}
                            chooseLabel={localStage.file ? "Replace Document" : "Select PDF Document"}
                            className={classNames('w-full', { 'p-invalid': submitted && !localStage.file && !localStage._id })}
                        />
                        
                        {localStage.file && (
                            <div className="mt-2 flex align-items-center text-green-600 animate-fadein">
                                <i className="pi pi-check-circle mr-2"></i>
                                <small className="font-bold">Ready: {localStage.file.name}</small>
                            </div>
                        )}

                        {submitted && !localStage.file && !localStage._id && (
                            <small className="p-error block mt-2">A PDF document is required for this stage.</small>
                        )}
                    </div>

                    {/* The Rules / Guidelines Placeholder */}
                    <div className="surface-100 p-3 border-round border-1 border-200">
                        <span className="text-xs font-bold text-700 uppercase tracking-wider">Submission Guidelines</span>
                        <ul className="text-xs mt-2 pl-3 text-600 mb-0 line-height-3">
                            <li>Maximum file size permitted is <strong>15MB</strong>.</li>
                            <li>Only <strong>PDF</strong> files are accepted for technical review.</li>
                            <li>This is a <strong>{stageInfo?.category || 'standard'}</strong> stage; ensure all data is accurate.</li>
                            <li>A minimum score of <strong>{stageInfo?.minAcceptanceScore || 0}</strong> is required to pass.</li>
                        </ul>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveProjectApplication;