'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { FileUpload, FileUploadSelectEvent } from 'primereact/fileupload';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { PhaseDocApi } from '../api/phase.doc.api';
import { PhaseDocument, validate } from '../model/phase.doc';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SavePhaseDocument = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<PhaseDocument>) => {
    const [localPhaseDoc, setLocalPhaseDoc] = useState<PhaseDocument>({ ...item });
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLocalPhaseDoc({ ...item });
        setSubmitted(false);
    }, [item]);

    const onFileSelect = (event: FileUploadSelectEvent) => {
        const file = event.files[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.current?.show({
                severity: 'warn',
                summary: 'File too large',
                detail: 'Maximum file size is 5MB',
                life: 3000
            });
            return;
        }

        setLocalPhaseDoc({
            ...localPhaseDoc,
            file
        });
    };

    const handleSave = async () => {
        setSubmitted(true);

        const validation = validate(localPhaseDoc);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation',
                detail: validation.message
            });
            return;
        }

        setSaving(true);
        setProgress(30);

        try {
            const apiMethod = localPhaseDoc._id ? PhaseDocApi.update : PhaseDocApi.create;
            const saved = await apiMethod(localPhaseDoc);

            setProgress(100);

            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Phase document saved successfully',
                life: 2000
            });

            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Upload failed',
                detail: err.message || String(err),
                life: 3000
            });
        } finally {
            setSaving(false);
            setTimeout(() => setProgress(0), 1500);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text p-button-secondary"
            />
            <Button
                label="Save Document"
                icon="pi pi-check"
                onClick={handleSave}
                loading={saving}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '650px' }}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
                header={
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-file text-primary text-xl"></i>
                        <span>{localPhaseDoc._id ? 'Edit Phase Document' : 'Add Phase Document'}</span>
                    </div>
                }
                modal
                footer={footer}
                onHide={onHide}
                contentClassName="p-4"
            >
                <div className="p-fluid grid">
                    {/* Description */}
                    <div className="col-12">
                        <label htmlFor="description" className="font-bold block mb-2">
                            Description
                        </label>
                        <InputTextarea
                            id="description"
                            rows={4}
                            value={localPhaseDoc.description || ''}
                            onChange={(e) =>
                                setLocalPhaseDoc({
                                    ...localPhaseDoc,
                                    description: e.target.value
                                })
                            }
                            className={classNames({
                                'p-invalid': submitted && !localPhaseDoc.description
                            })}
                        />
                    </div>

                    {/* Drag & Drop File Upload */}
                    <div className="col-12">
                        <label className="font-bold block mb-2">Upload Document</label>
                        <FileUpload
                            name="file"
                            mode="advanced"
                            auto={false}
                            customUpload
                            chooseLabel="Select File"
                            cancelLabel="Remove"
                            uploadLabel="Upload"
                            maxFileSize={MAX_FILE_SIZE}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.png,.jpg"
                            emptyTemplate={
                                <p className="m-0">
                                    Drag and drop file here to upload
                                </p>
                            }
                            onSelect={onFileSelect}
                        />

                        {localPhaseDoc.documentPath && (
                            <small className="block mt-2 text-500">
                                Existing file: {localPhaseDoc.documentPath}
                            </small>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {progress > 0 && (
                        <div className="col-12 mt-2">
                            <ProgressBar value={progress} />
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SavePhaseDocument;