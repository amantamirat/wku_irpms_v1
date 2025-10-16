import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { ResultApi } from "../api/result.api";
import { Result, validateResult } from "../models/result.model";

interface SaveResultDialogProps {
    visible: boolean;
    result: Result;
    setResult: (result: Result) => void;
    onSave?: () => Promise<void>;
    onCompelete?: () => void;
    onHide: () => void;
}

const SaveResultDialog = ({ visible, result, setResult, onSave, onCompelete, onHide }: SaveResultDialogProps) => {
    const toast = useRef<Toast>(null);

    const saveResult = async () => {
        try {
            const validation = validateResult(result);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
            if (onSave) {
                await onSave();
            } else {
                if (result._id) {
                    const updated = await ResultApi.updateResult(result);
                    setResult({ ...result, updatedAt: updated.updatedAt });
                } else {
                    const created = await ResultApi.createResult(result);
                    setResult({ ...result, _id: created._id, createdAt: created.createdAt, updatedAt: created.updatedAt });
                }
            }
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: `Result Saved.`,
                life: 2000
            });
            if (onCompelete) {
                setTimeout(() => onCompelete(), 2000);
            }
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
                        onValueChange={(e) => setResult({ ...result, score: e.value ?? 0 })}
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
                        onChange={(e) => setResult({ ...result, comment: e.target.value })}
                        autoResize
                        placeholder="Enter comment (optional)"
                    />
                </div>

            </Dialog>
        </>
    );
}

export default SaveResultDialog;