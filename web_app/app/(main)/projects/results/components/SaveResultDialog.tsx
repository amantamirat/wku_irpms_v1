import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Result, validateResult } from "../models/result.model";
import { InputText } from "primereact/inputtext";
import { useRef } from "react";
import { Toast } from "primereact/toast";

interface SaveResultDialogProps {
    result: Result;
    setResult: (result: Result) => void;
    visible: boolean;
    onSave?: () => Promise<void>;
    onHide: () => void;
}

export default function SaveResultDialog({ result, setResult, visible, onSave, onHide }: SaveResultDialogProps) {
    const toast = useRef<Toast>(null);
    const updateField = (field: keyof Result, value: any) => {
        setResult({ ...result, [field]: value });
    };

    const saveResult = async () => {
        try {
            const validation = validateResult(result);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            if (onSave) {
                await onSave();
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Result Saved.`,
                life: 2000
            });
        } catch (err) {
            toast.current?.show({
                severity: 'error',
                summary: 'Failed to Save Result',
                detail: '' + err,
                life: 2000
            });
        }
    };

    const footer = (
        <>
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save" icon="pi pi-check" text onClick={saveResult} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "500px" }}
                header="Result Details"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label htmlFor="score">Score</label>
                    <InputNumber
                        id="score"
                        value={result.score}
                        onValueChange={(e) => updateField("score", e.value ?? 0)}
                        min={0}
                        placeholder="Enter score"
                    />
                </div>
                <div className="field">
                    <label htmlFor="comment">Comment</label>
                    <InputTextarea
                        id="comment"
                        rows={3}
                        value={result.comment}
                        onChange={(e) => updateField("comment", e.target.value)}
                        autoResize
                        placeholder="Enter comment (optional)"
                    />
                </div>
                <div className="field">
                    <label htmlFor="status">Status</label>
                    <InputText
                        id="status"
                        value={result.status}
                        onChange={(e) => updateField("status", e.target.value)}
                        placeholder="Enter status (optional)"
                    />
                </div>
            </Dialog>
        </>
    );
}
