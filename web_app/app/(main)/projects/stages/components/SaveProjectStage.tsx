'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { classNames } from 'primereact/utils';
import { ProjectStage, ProjectStageStatus, validateProjectStage, sanitizeProjectStage } from '../models/project.stage.model';
import { ProjectStageApi } from '../api/project.stage.api'; // Assuming this exists
import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { InputText } from 'primereact/inputtext';

const SaveProjectStage = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<ProjectStage>) => {
    const toast = useRef<Toast>(null);
    const [localStage, setLocalStage] = useState<Partial<ProjectStage>>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Sync local state when the item prop changes
    useEffect(() => {
        setLocalStage({ ...item });
        setSubmitted(false);
    }, [item, visible]);

    const hide = () => {
        setSubmitted(false);
        onHide();
    };

    const onFileSelect = (e: FileUploadSelectEvent) => {
    if (e.files && e.files.length > 0) {
        setLocalStage((prev: Partial<ProjectStage>) => ({ ...prev, file: e.files[0] }));
    }
};

    const saveStage = async () => {
        setSubmitted(true);

        const validation = validateProjectStage(localStage);
        if (!validation.valid) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Validation Failed', 
                detail: validation.message, 
                life: 3000 
            });
            return;
        }

        try {
            setIsUploading(true);
            const payload = sanitizeProjectStage(localStage);
            
            let saved: ProjectStage;
            // Note: If you are sending a File, you likely need to use FormData in your Api call
            if (localStage._id) {
                saved = await ProjectStageApi.update(payload);
            } else {
                saved = await ProjectStageApi.create(payload as ProjectStage);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Project stage saved successfully',
                life: 2000,
            });

            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save stage',
                life: 3000,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={hide} disabled={isUploading} />
            <Button label="Save" icon="pi pi-check" onClick={saveStage} severity="success" loading={isUploading} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '500px' }}
                header={localStage._id ? 'Edit Project Stage' : 'Submit Project Stage'}
                modal
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                
                {/* File Upload Section */}
                <div className="field mb-4">
                    <label className="font-bold">Documentation (PDF)</label>
                    {localStage.documentPath && (
                        <div className="mb-2 text-sm text-blue-600">
                            <i className="pi pi-file-pdf mr-2"></i>
                            Current: {localStage.documentPath.split('/').pop()}
                        </div>
                    )}
                    <FileUpload
                        mode="basic"
                        name="file"
                        accept="application/pdf"
                        maxFileSize={10000000} // 10MB
                        onSelect={onFileSelect}
                        auto={false}
                        chooseLabel={localStage.file ? "Change File" : "Choose PDF"}
                        className={classNames({ 'p-invalid': submitted && !localStage.file && !localStage._id })}
                    />
                    {localStage.file && (
                        <small className="mt-2 block text-green-600">
                            Ready to upload: {localStage.file.name}
                        </small>
                    )}
                    {submitted && !localStage.file && !localStage._id && (
                        <small className="p-error">A PDF document is required for new submissions.</small>
                    )}
                </div>

                {/* Optional: Score (only if editing/reviewing) */}
                {localStage._id && (
                    <div className="field">
                        <label htmlFor="totalScore" className="font-bold">Total Score</label>
                        <InputText
                            id="totalScore"
                            type="number"
                            value={localStage.totalScore?.toString() || ''}
                            onChange={(e) => setLocalStage({ ...localStage, totalScore: parseFloat(e.target.value) })}
                        />
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SaveProjectStage;