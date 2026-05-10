'use client';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { ProjectStageApi } from '../api/project.stage.api';
import { ProjectStage, sanitizeProjectStage, validateProjectStage } from '../models/project.stage.model';

const SaveProjectStage = ({ visible, item, onHide, onComplete }: EntitySaveDialogProps<ProjectStage>) => {
    const toast = useRef<Toast>(null);
    const [localStage, setLocalStage] = useState<Partial<ProjectStage>>({ ...item });
    const [submitted, setSubmitted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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
        const validation = validateProjectStage(localStage);
        
        if (!validation.valid) {
            toast.current?.show({ severity: 'error', summary: 'Validation Failed', detail: validation.message });
            return;
        }

        try {
            setIsUploading(true);
            const payload = sanitizeProjectStage(localStage);
            
            const saved = localStage._id 
                ? await ProjectStageApi.update(payload) 
                : await ProjectStageApi.create(payload as ProjectStage);

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
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-send text-primary text-xl"></i>
                        <span>{localStage._id ? 'Edit Submission' : 'New Stage Submission'}</span>
                    </div>
                }
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="flex flex-column gap-3 mt-2">
                    <Message 
                        severity="info" 
                        text="Please ensure your documentation is in PDF format and contains all required signatures." 
                        className="justify-content-start"
                    />

                    <div className="field">
                        <label className="font-bold block mb-2">Technical Documentation</label>
                        
                        {/* Current File Preview */}
                        {localStage.documentPath && !localStage.file && (
                            <div className="p-3 border-1 border-round border-300 surface-50 mb-3 flex align-items-center justify-content-between">
                                <div className="flex align-items-center">
                                    <i className="pi pi-file-pdf text-red-500 text-2xl mr-3"></i>
                                    <span className="text-sm font-medium">Existing Document</span>
                                </div>
                                <Button icon="pi pi-external-link" text className="p-button-sm" tooltip="View Current" />
                            </div>
                        )}

                        <FileUpload
                            mode="basic"
                            name="file"
                            accept="application/pdf"
                            maxFileSize={15000000} // 15MB
                            onSelect={onFileSelect}
                            auto={false}
                            chooseLabel={localStage.file ? "Replace PDF" : "Select Document (PDF)"}
                            className={classNames('w-full', { 'p-invalid': submitted && !localStage.file && !localStage._id })}
                        />
                        
                        {localStage.file && (
                            <div className="mt-2 flex align-items-center text-green-600 animate-fadein">
                                <i className="pi pi-check-circle mr-2"></i>
                                <small className="font-bold">Ready: {localStage.file.name}</small>
                            </div>
                        )}

                        {submitted && !localStage.file && !localStage._id && (
                            <small className="p-error block mt-2">A PDF submission is mandatory.</small>
                        )}
                    </div>

                    <div className="surface-100 p-3 border-round">
                        <span className="text-xs font-bold text-500 uppercase">Submission Guidelines</span>
                        <ul className="text-xs mt-2 pl-3 text-600 mb-0">
                            <li>Maximum file size: 15MB</li>
                            <li>Only PDF formats are accepted</li>
                            <li>Ensure the project title matches the document content</li>
                        </ul>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SaveProjectStage;