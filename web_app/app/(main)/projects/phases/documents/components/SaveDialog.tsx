'use client';

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { ProgressBar } from "primereact/progressbar";
import { useRef, useState, useEffect } from "react";

import { PhaseDocApi } from "../api/phase.doc.api";
import { PhaseDocument, validate } from "../model/phase.doc";

interface SaveDialogProps {
    phaseDoc: PhaseDocument;
    visible: boolean;
    onComplete?: (saved: PhaseDocument) => void;
    onHide: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const SavePhaseDocDialog = ({
    phaseDoc,
    visible,
    onComplete,
    onHide,
}: SaveDialogProps) => {

    const [local, setLocal] = useState<PhaseDocument>({ ...phaseDoc });
    const [progress, setProgress] = useState<number>(0);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLocal({ ...phaseDoc });
    }, [phaseDoc]);

    const onFileSelect = (event: FileUploadSelectEvent) => {

        const file = event.files[0];

        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.current?.show({
                severity: "warn",
                summary: "File too large",
                detail: "Maximum file size is 5MB",
                life: 3000,
            });
            return;
        }

        setLocal({
            ...local,
            file: file
        });
    };

    const savePhaseDoc = async () => {

        try {

            const validation = validate(local);
            if (!validation.valid) throw new Error(validation.message);

            setProgress(30);

            const created = await PhaseDocApi.create(local);

            setProgress(100);

            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Phase document uploaded successfully",
                life: 2000,
            });

            if (onComplete) onComplete(created);

        } catch (err) {

            toast.current?.show({
                severity: "error",
                summary: "Upload failed",
                detail: String(err),
                life: 3000,
            });

        } finally {
            setTimeout(() => setProgress(0), 1500);
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" onClick={savePhaseDoc} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header="Save Phase Document"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >

                {/* Description */}
                <div className="field">
                    <label>Description</label>
                    <InputTextarea
                        rows={4}
                        value={local.description || ""}
                        onChange={(e) =>
                            setLocal({
                                ...local,
                                description: e.target.value
                            })
                        }
                    />
                </div>

                {/* Drag & Drop File Upload */}
                <div className="field">
                    <label>Upload Document</label>

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

                    {local.documentPath && (
                        <small className="block mt-2">
                            Existing file: {local.documentPath}
                        </small>
                    )}

                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                    <div className="mt-3">
                        <ProgressBar value={progress}></ProgressBar>
                    </div>
                )}

            </Dialog>
        </>
    );
};

export default SavePhaseDocDialog;