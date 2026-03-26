'use client';
import React, { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { FileUpload, FileUploadSelectEvent } from "primereact/fileupload";
import { Toast } from "primereact/toast";
import { Message } from "primereact/message";
import { EntityApi } from "@/api/EntityApi";

interface ImportDialogProps<T, Q = undefined> {
    api: EntityApi<T, Q>;
    parentId?: string;
    visible: boolean;
    onComplete: () => void;
    onHide: () => void;
}

const ImportDialog = <T, Q = undefined>({
    api,
    parentId,
    visible,
    onComplete,
    onHide,
}: ImportDialogProps<T, Q>) => {

    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [importing, setImporting] = useState(false);
    const toast = useRef<Toast>(null);

    // ✅ Only store file (no parsing)
    const onTemplateSelect = (e: FileUploadSelectEvent) => {
        const selectedFile = e.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setFileName(selectedFile.name);
    };

    const handleImport = async () => {
        if (!file) return;

        try {
            setImporting(true);

            if (!api.import) {
                toast.current?.show({
                    severity: "error",
                    summary: "Import Not Supported",
                    detail: "This entity does not support import.",
                });
                return;
            }

            const formData = new FormData();

            if (parentId) {
                formData.append("parentId", parentId);
            }

            formData.append("file", file);

            await api.import(formData, parentId);

            toast.current?.show({
                severity: "success",
                summary: "Import Successful",
                detail: `${fileName} uploaded successfully.`,
                life: 2000,
            });

            setTimeout(() => {
                onComplete();
                onHide();
                setFile(null);
                setFileName("");
            }, 800);

        } catch (err: any) {
            toast.current?.show({
                severity: "error",
                summary: "Import Failed",
                detail: err.message || "An error occurred during import.",
            });
        } finally {
            setImporting(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                text
                onClick={onHide}
                disabled={importing}
            />
            <Button
                label="Upload"
                icon="pi pi-upload"
                onClick={handleImport}
                loading={importing}
                disabled={!file} // ✅ FIXED
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                header="Import"
                visible={visible}
                style={{ width: "500px" }}
                modal
                footer={footer}
                onHide={onHide}
            >
                <div className="flex flex-column gap-3">

                    <Message
                        severity="info"
                        text="Upload a file to import data. Supported formats depend on the system."
                    />

                    <FileUpload
                        mode="advanced"
                        name="file"
                        accept=".json,.csv,.xlsx"
                        maxFileSize={1000000}
                        onSelect={onTemplateSelect}
                        customUpload
                        auto={false}
                        chooseLabel="Select File"
                        className="w-full"
                        uploadOptions={{ style: { display: "none" } }}
                        emptyTemplate={
                            file ? (
                                <div className="flex align-items-center gap-2 text-green-600">
                                    <i className="pi pi-file-import" />
                                    <span>{fileName}</span>
                                </div>
                            ) : (
                                <p className="m-0">Drag and drop your file here.</p>
                            )
                        }
                    />

                    {file && (
                        <small className="text-secondary">
                            Ready to upload <b>{fileName}</b>
                        </small>
                    )}

                </div>
            </Dialog>
        </>
    );
};

export default ImportDialog;