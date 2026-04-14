'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { PhaseApi } from "../api/phase.api";
import { Phase, validatePhase } from "../models/phase.model";
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SavePhase = ({ visible, item: phase, onHide, onComplete }: EntitySaveDialogProps<Phase>) => {
    const [localPhase, setLocalPhase] = useState<Phase>({ ...phase });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (visible) {
            setLocalPhase({ ...phase });
        }
    }, [visible, phase]);

    const updateField = (field: keyof Phase, value: any) => {
        setLocalPhase(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            const validation = validatePhase(localPhase);
            if (!validation.valid) throw new Error(validation.message);

            const saved = localPhase._id ? await PhaseApi.update(localPhase) : await PhaseApi.create(localPhase);

            toast.current?.show({ severity: "success", summary: "Success", detail: "Phase saved" });
            if (onComplete) onComplete(saved);
        } catch (err: any) {
            toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "600px" }}
                header="Phase Details"
                modal
                className="p-fluid"
                onHide={onHide}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
                        <Button label="Save Phase" icon="pi pi-check" onClick={handleSave} />
                    </div>
                }
            >
                <div className="grid">
                    <div className="field col-12 md:col-3">
                        <label className="font-bold">Order</label>
                        <InputNumber 
                            value={localPhase.order} 
                            onValueChange={(e) => updateField("order", e.value)} 
                            min={1} 
                            required
                        />
                    </div>
                    <div className="field col-12 md:col-9">
                        <label className="font-bold">Title</label>
                        <InputText 
                            value={localPhase.title} 
                            onChange={(e) => updateField("title", e.target.value)} 
                            placeholder="e.g. Foundation Phase"
                            required
                        />
                    </div>
                </div>

                <div className="field">
                    <label className="font-bold">Description</label>
                    <InputTextarea 
                        value={localPhase.description} 
                        onChange={(e) => updateField("description", e.target.value)} 
                        placeholder="Detailed description of the phase activities and objectives"
                        rows={4}
                        autoResize
                    />
                </div>

                <div className="grid">
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Duration (Days)</label>
                        <InputNumber 
                            value={localPhase.duration} 
                            onValueChange={(e) => updateField("duration", e.value)} 
                            min={1}
                            required
                        />
                    </div>
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Budget (ETB)</label>
                        <InputNumber 
                            value={localPhase.budget} 
                            onValueChange={(e) => updateField("budget", e.value)} 
                            min={0}
                            mode="currency"
                            currency="ETB"
                            required
                        />
                    </div>
                </div>

                {localPhase.status && (
                    <div className="field">
                        <label className="font-bold">Status</label>
                        <InputText 
                            value={localPhase.status} 
                            onChange={(e) => updateField("status", e.target.value)} 
                            disabled
                        />
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SavePhase;