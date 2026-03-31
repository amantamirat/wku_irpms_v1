'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useRef, useState } from "react";
import { PhaseApi } from "../api/phase.api";
import { Phase, validatePhase, PhaseBreakdown } from "../models/phase.model";
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SavePhase = ({ visible, item: phase, onHide, onComplete }: EntitySaveDialogProps<Phase>) => {
    const [localPhase, setLocalPhase] = useState<Phase>({ ...phase });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (visible) {
            setLocalPhase({ ...phase, breakdown: phase.breakdown || [] });
        }
    }, [visible, phase]);

    const hasBreakdown = localPhase.breakdown && localPhase.breakdown.length > 0;

    const updateField = (field: keyof Phase, value: any) => {
        setLocalPhase(prev => ({ ...prev, [field]: value }));
    };

    /**
     * Recalculates totals based on breakdown array
     */
    const recalculateFromBreakdown = (breakdown: PhaseBreakdown[]) => {
        const totalDuration = breakdown.reduce((sum, act) => sum + (act.duration || 0), 0);
        const totalBudget = breakdown.reduce((sum, act) => sum + (act.budget || 0), 0);
        
        setLocalPhase(prev => ({
            ...prev,
            breakdown,
            duration: totalDuration,
            budget: totalBudget
        }));
    };

    const addActivity = () => {
        const newActivity: PhaseBreakdown = { activity: '', duration: 0, budget: 0 };
        const updatedBreakdown = [...(localPhase.breakdown || []), newActivity];
        recalculateFromBreakdown(updatedBreakdown);
    };

    const updateActivity = (index: number, field: keyof PhaseBreakdown, value: any) => {
        const updatedBreakdown = [...(localPhase.breakdown || [])];
        updatedBreakdown[index] = { ...updatedBreakdown[index], [field]: value };
        recalculateFromBreakdown(updatedBreakdown);
    };

    const removeActivity = (index: number) => {
        const updatedBreakdown = localPhase.breakdown.filter((_, i) => i !== index);
        // If we just removed the last item, we keep the existing totals but clear the array
        if (updatedBreakdown.length === 0) {
            setLocalPhase(prev => ({ ...prev, breakdown: [] }));
        } else {
            recalculateFromBreakdown(updatedBreakdown);
        }
    };

    const savePhase = async () => {
        try {
            const validation = validatePhase(localPhase);
            if (!validation.valid) throw new Error(validation.message);

            let saved: Phase;
            if (localPhase._id) {
                saved = await PhaseApi.update(localPhase);
            } else {
                saved = await PhaseApi.create(localPhase);
            }

            toast.current?.show({ severity: "success", summary: "Successful", detail: "Phase saved", life: 2000 });
            if (onComplete) onComplete(saved);
        } catch (err: any) {
            toast.current?.show({ severity: "error", summary: "Error", detail: err.message || String(err), life: 3000 });
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
            <Button label="Save Phase" icon="pi pi-check" onClick={savePhase} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog visible={visible} style={{ width: "850px" }} header="Configure Phase" modal className="p-fluid" footer={footer} onHide={onHide}>
                <div className="grid">
                    <div className="field col-12 md:col-2">
                        <label className="font-bold">Order</label>
                        <InputNumber value={localPhase.order} onValueChange={(e) => updateField("order", e.value)} min={1} />
                    </div>
                    <div className="field col-12 md:col-10">
                        <label className="font-bold">Description / Activity Name</label>
                        <InputText value={localPhase.description} onChange={(e) => updateField("description", e.target.value)} placeholder="e.g. Phase 1: Initial Research" />
                    </div>
                </div>

                <div className="grid">
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Total Duration (Days)</label>
                        <InputNumber 
                            value={localPhase.duration} 
                            onValueChange={(e) => updateField("duration", e.value ?? 0)} 
                            disabled={hasBreakdown}
                            placeholder={hasBreakdown ? "Calculated from breakdown" : "Enter total days"}
                            className={hasBreakdown ? "surface-100" : ""}
                        />
                        {hasBreakdown && <small className="text-primary">Calculated from activities</small>}
                    </div>
                    <div className="field col-12 md:col-6">
                        <label className="font-bold">Total Budget (ETB)</label>
                        <InputNumber 
                            value={localPhase.budget} 
                            onValueChange={(e) => updateField("budget", e.value ?? 0)} 
                            disabled={hasBreakdown}
                            mode="currency" currency="ETB" locale="en-ET"
                            placeholder={hasBreakdown ? "Calculated from breakdown" : "Enter total budget"}
                            className={hasBreakdown ? "surface-100" : ""}
                        />
                        {hasBreakdown && <small className="text-primary">Calculated from activities</small>}
                    </div>
                </div>

                <div className="flex justify-content-between align-items-center mt-4 mb-2">
                    <h5 className="m-0 text-secondary">Breakdown</h5>
                    <Button label="Add Activity Item" icon="pi pi-plus" size="small" severity="info" text onClick={addActivity} type="button" />
                </div>

                <DataTable value={localPhase.breakdown} scrollable scrollHeight="200px" className="mb-3 border-round overflow-hidden border-1 surface-border" emptyMessage="No sub-activities defined. Using phase-level totals.">
                    <Column header="Sub-Activity" body={(_, options) => (
                        <InputText value={localPhase.breakdown[options.rowIndex].activity}
                            onChange={(e) => updateActivity(options.rowIndex, 'activity', e.target.value)} placeholder="Task description" />
                    )} />
                    <Column header="Days" style={{ width: '100px' }} body={(_, options) => (
                        <InputNumber value={localPhase.breakdown[options.rowIndex].duration}
                            onValueChange={(e) => updateActivity(options.rowIndex, 'duration', e.value)} />
                    )} />
                    <Column header="Budget" style={{ width: '160px' }} body={(_, options) => (
                        <InputNumber value={localPhase.breakdown[options.rowIndex].budget}
                            onValueChange={(e) => updateActivity(options.rowIndex, 'budget', e.value)} mode="currency" currency="ETB" locale="en-ET" />
                    )} />
                    <Column body={(_, options) => (
                        <Button icon="pi pi-trash" severity="danger" text onClick={() => removeActivity(options.rowIndex)} />
                    )} style={{ width: '50px' }} />
                </DataTable>

                {hasBreakdown && (
                    <div className="p-3 border-round bg-primary-reverse flex justify-content-between">
                        <span><strong>Breakdown Totals:</strong></span>
                        <span>{localPhase.duration} Days | {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(localPhase.budget)}</span>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SavePhase;