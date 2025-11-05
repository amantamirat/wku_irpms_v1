'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { Phase, validatePhase } from "../models/phase.model";
import { PhaseApi } from "../api/phase.api";

interface SavePhaseDialogProps {
    phase: Phase;
    visible: boolean;
    onSave?: (saved: Phase) => void;
    onComplete?: (saved: Phase) => void;
    onHide: () => void;
}

export default function SavePhaseDialog({ phase, visible, onSave, onComplete, onHide }: SavePhaseDialogProps) {
    const [localPhase, setLocalPhase] = useState<Phase>({ ...phase });
    const toast = useRef<Toast>(null);

    const updateField = (field: keyof Phase, value: any) => {
        setLocalPhase({ ...localPhase, [field]: value });
    };

    const savePhase = async () => {
        try {
            const validation = validatePhase(localPhase);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Phase;
            if (onSave) {
                saved = { ...localPhase };
                onSave(localPhase);
            } else {
                if (localPhase._id) {
                    saved = await PhaseApi.updatePhase(localPhase);
                } else {
                    saved = await PhaseApi.createPhase(localPhase);
                }
                saved = { ...saved, project: localPhase.project, type: localPhase.type };
                toast.current?.show({
                    severity: "success",
                    summary: "Successful",
                    detail: "Phase saved successfully",
                    life: 2000,
                });
            }

            if (onComplete) onComplete(saved);
        } catch (err) {
            toast.current?.show({
                severity: "error",
                summary: "Failed to save phase",
                detail: String(err),
                life: 2000,
            });
        }
    };

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
                header="Phase Details"
                modal
                className="p-fluid"
                footer={footer}
                onHide={onHide}
            >
                <div className="field">
                    <label htmlFor="activity">Activity</label>
                    <InputText
                        id="activity"
                        value={localPhase.activity}
                        onChange={(e) => updateField("activity", e.target.value)}
                        placeholder="Enter activity name"
                    />
                </div>

                <div className="field">
                    <label htmlFor="duration">Duration (days)</label>
                    <InputNumber
                        id="duration"
                        value={localPhase.duration}
                        onValueChange={(e) => updateField("duration", e.value ?? 0)}
                        min={1}
                    />
                </div>

                <div className="field">
                    <label htmlFor="budget">Budget (ETB)</label>
                    <InputNumber
                        id="budget"
                        value={localPhase.budget}
                        onValueChange={(e) => updateField("budget", e.value ?? 0)}
                        mode="currency"
                        currency="ETB"
                        locale="en-ET"
                    />
                </div>

                <div className="field">
                    <label htmlFor="description">Description</label>
                    <InputTextarea
                        id="description"
                        rows={3}
                        value={localPhase.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        autoResize
                    />
                </div>
            </Dialog>
        </>
    );
}
