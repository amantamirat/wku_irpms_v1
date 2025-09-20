import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Phase, validatePhase } from "../models/phase.model";
import { InputText } from "primereact/inputtext";
import { useRef, useState } from "react";
import { Toast } from "primereact/toast";
import { validateProjectTheme } from "../../themes/models/project.theme.model";


interface SavePhaseDialogProps {
    phase: Phase;
    setPhase: (phase: Phase) => void;
    visible: boolean;
    onAdd: () => Promise<void>;
    onHide: () => void;
}

export default function SavePhaseDialog({ phase, setPhase, visible, onAdd, onHide }: SavePhaseDialogProps) {

    const toast = useRef<Toast>(null);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();
    const updateField = (field: keyof Phase, value: any) => {
        setPhase({ ...phase, [field]: value });
    };

    const savePhase = async () => {
        try {
            const result = validatePhase(phase);
            if (!result.valid) {
                setErrorMessage(result.message);
                return;
            }
            setErrorMessage(undefined);
            await onAdd();
            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: "Phase Saved.",
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
            <Button label="Save" icon="pi pi-check" text onClick={savePhase} />
        </>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header="Add Phase"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label htmlFor="activity">Activity</label>
                    <InputText
                        id="activity"
                        value={phase.activity}
                        onChange={(e) => updateField("activity", e.target.value)}
                        required
                        autoFocus
                    />
                </div>
                <div className="field">
                    <label htmlFor="order">Order</label>
                    <InputNumber
                        id="order"
                        value={phase.order}
                        onValueChange={(e) => updateField("order", e.value ?? 0)}
                        min={1}
                        placeholder="Enter phase order"
                    />
                </div>

                <div className="field">
                    <label htmlFor="duration">Duration (days)</label>
                    <InputNumber
                        id="duration"
                        value={phase.duration}
                        onValueChange={(e) => updateField("duration", e.value ?? 0)}
                        min={1}
                        placeholder="Enter duration in days"
                    />
                </div>

                <div className="field">
                    <label htmlFor="budget">Budget (ETB)</label>
                    <InputNumber
                        id="budget"
                        value={phase.budget}
                        onValueChange={(e) => updateField("budget", e.value ?? 0)}
                        mode="currency"
                        currency="ETB"
                        locale="en-ET"
                        placeholder="Enter budget"
                    />
                </div>

                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        rows={3}
                        value={phase.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        autoResize
                        placeholder="Enter description (optional)"
                    />
                </div>
                {errorMessage && (
                    <small className="p-error">{errorMessage}</small>
                )}
            </Dialog>
        </>
    );
}
