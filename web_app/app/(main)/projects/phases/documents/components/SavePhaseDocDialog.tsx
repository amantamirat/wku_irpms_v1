'use client';
import { Project } from "next/dist/build/swc/types";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import UploadForm from "../../../components/UploadForm";
import { PhaseDocApi } from "../api/phase.doc.api";
import { PhaseDocument } from "../model/phase.doc";


interface SavePhaseDocDialogProps {
    phaseDoc: PhaseDocument;
    visible: boolean;
    onComplete?: (saved: PhaseDocument) => void;
    onHide: () => void;
}

const SavePhaseDocDialog = ({
    phaseDoc,
    visible,
    onComplete,
    onHide,
}: SavePhaseDocDialogProps) => {

    const [localPhaseDoc, setLocalPhaseDoc] = useState<PhaseDocument>({ ...phaseDoc });

    const toast = useRef<Toast>(null);

    const updateField = (field: keyof PhaseDocument, value: any) => {
        setLocalPhaseDoc({ ...localPhaseDoc, [field]: value });
    };

    const savePhaseDoc = async () => {
        try {
            //const validation = validatePhaseDocument(localPhaseDoc);
            //if (!validation.valid) throw new Error(validation.message);

            let saved: PhaseDocument;
            let syncedProject: Project | undefined = undefined;
            if (localPhaseDoc._id) {
                return;
                // saved = await PhaseDocumentApi.updatePhaseDoc(localPhaseDoc);
            } else {
                const created = await PhaseDocApi.create(localPhaseDoc);
                saved = created;
            }



            toast.current?.show({
                severity: "success",
                summary: "Successful",
                detail: "Project stage saved successfully",
                life: 2000,
            });

            if (onComplete) onComplete(saved);
            //onHide()
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Failed to save phase document",
                detail: String(err),
                life: 2000,
            });
        }
    };



    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={savePhaseDoc} />
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
                {!localPhaseDoc._id &&
                    <>
                        <UploadForm
                            onUpload={(file) => updateField("file", file)}
                        />
                    </>
                }
            </Dialog>
        </>
    );
};

export default SavePhaseDocDialog;
