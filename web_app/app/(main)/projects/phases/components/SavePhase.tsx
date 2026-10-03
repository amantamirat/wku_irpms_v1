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

            toast.current?.show({ severity: "success", summary: "Success", detail: "Phase saved successfully" });
            if (onComplete) onComplete(saved);
        } catch (err: any) {
            toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
        }
    };

    const renderHeader = () => (
        <div className="flex align-items-center gap-2">
            <i className="pi pi-flag text-primary text-xl"></i>
            <span className="text-xl font-bold">{localPhase._id ? 'Edit Phase' : 'New Phase'}</span>
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: "550px" }}
                header={renderHeader}
                modal
                className="p-fluid"
                onHide={onHide}
                footer={
                    <div className="flex justify-content-end gap-2 pt-3 border-top-1 surface-border">
                        <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" onClick={onHide} />
                        <Button label="Save Phase" icon="pi pi-check" onClick={handleSave} />
                    </div>
                }
            >
                <div className="flex flex-column gap-4 pt-3">
                    {/* Title */}
                    <div className="field m-0">
                        <label htmlFor="title" className="font-bold block mb-2">Title <span className="text-red-500">*</span></label>
                        <InputText 
                            id="title"
                            value={localPhase.title || ''} 
                            onChange={(e) => updateField("title", e.target.value)} 
                            placeholder="e.g. Foundation Phase"
                            required
                        />
                    </div>

                    {/* Description (Optional) */}
                    <div className="field m-0">
                        <label htmlFor="description" className="font-bold block mb-2">
                            Description <span className="text-500 font-normal">(Optional)</span>
                        </label>
                        <InputTextarea 
                            id="description"
                            value={localPhase.description || ''} 
                            onChange={(e) => updateField("description", e.target.value)} 
                            placeholder="Detailed description of the phase activities and objectives"
                            rows={3}
                            autoResize
                        />
                    </div>

                    {/* Duration & Budget Row */}
                    <div className="formgrid grid m-0">
                        <div className="field col-12 md:col-6 p-0 md:pr-2">
                            <label htmlFor="duration" className="font-bold block mb-2">Duration (Days) <span className="text-red-500">*</span></label>
                            <InputNumber 
                                id="duration"
                                value={localPhase.duration} 
                                onValueChange={(e) => updateField("duration", e.value)} 
                                min={1}
                                required
                                placeholder="e.g. 30"
                            />
                        </div>
                        <div className="field col-12 md:col-6 p-0 md:pl-2 mt-3 md:mt-0">
                            <label htmlFor="budget" className="font-bold block mb-2">Budget (ETB) <span className="text-red-500">*</span></label>
                            <InputNumber 
                                id="budget"
                                value={localPhase.budget} 
                                onValueChange={(e) => updateField("budget", e.value)} 
                                min={0}
                                mode="currency"
                                currency="ETB"
                                required
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Status (Read-only if present) */}
                    {localPhase.status && (
                        <div className="field m-0">
                            <label htmlFor="status" className="font-bold block mb-2">Status</label>
                            <InputText 
                                id="status"
                                value={localPhase.status} 
                                disabled 
                                className="surface-ground"
                            />
                        </div>
                    )}
                </div>
            </Dialog>
        </>
    );
};

export default SavePhase;