import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { ProjectStage, validateProjectStage } from "../models/stage.model";



interface SaveProjectStageDialogProps {
    projectStage: ProjectStage;
    setProjectStage: (projectStage: ProjectStage) => void;
    visible: boolean;
    onAdd: () => Promise<void>;
    onHide: () => void;
}

export default function SaveProjectStageDialog({ projectStage, setProjectStage, visible, onAdd, onHide }: SaveProjectStageDialogProps) {

    const toast = useRef<Toast>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const updateField = (field: keyof ProjectStage, value: any) => {
        setProjectStage({ ...projectStage, [field]: value });
    };

    const saveProjectStage = async () => {
        try {
            const result = validateProjectStage(projectStage);
            if (!result.valid) {
                setErrorMessage(result.message);
                return;
            }
            setErrorMessage(undefined);
            await onAdd();
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: "ProjectStage Saved.",
                life: 2000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to save project theme',
                detail: '' + err,
                life: 3000
            });
        }
    }

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveProjectStage} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header="ProjectStage Details"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >                

                
                {errorMessage && (
                    <small className="p-error">{errorMessage}</small>
                )}
            </Dialog>
        </>
    );
}
