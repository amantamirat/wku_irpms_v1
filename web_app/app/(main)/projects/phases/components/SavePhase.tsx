'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { SelectButton } from "primereact/selectbutton"; // Added for the toggle
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useRef, useState } from "react";
import { PhaseApi } from "../api/phase.api";
import { Phase, validatePhase, PhaseBreakdown } from "../models/phase.model";
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SavePhase = ({ visible, item: phase, onHide, onComplete }: EntitySaveDialogProps<Phase>) => {
    const [localPhase, setLocalPhase] = useState<Phase>({ ...phase });
    const [mode, setMode] = useState<'simple' | 'detailed'>('simple');
    const toast = useRef<Toast>(null);

    const modeOptions = [
        { label: 'Simple', value: 'simple', icon: 'pi pi-tag' },
        { label: 'Detailed', value: 'detailed', icon: 'pi pi-list' }
    ];

    useEffect(() => {
        if (visible) {
            const hasExistingBreakdown = !!(phase.breakdown && phase.breakdown.length > 0);
            setLocalPhase({ ...phase, breakdown: phase.breakdown || [] });
            setMode(hasExistingBreakdown ? 'detailed' : 'simple');
        }
    }, [visible, phase]);

    const updateField = (field: keyof Phase, value: any) => {
        setLocalPhase(prev => ({ ...prev, [field]: value }));
    };

    // Logic for Detailed Mode
    const syncTotals = (breakdown: PhaseBreakdown[]) => {
        const d = breakdown.reduce((sum, b) => sum + (b.duration || 0), 0);
        const b = breakdown.reduce((sum, amt) => sum + (amt.budget || 0), 0);
        setLocalPhase(prev => ({ ...prev, breakdown, duration: d, budget: b }));
    };

    const addActivity = () => {
        const updated = [...(localPhase.breakdown || []), { activity: '', duration: 0, budget: 0 }];
        syncTotals(updated);
    };

    const handleSave = async () => {
        try {
            // If user switched back to simple mode, we should clear the breakdown
            const payload = { ...localPhase };
            if (mode === 'simple') {
                payload.breakdown = [];
            }

            const validation = validatePhase(payload);
            if (!validation.valid) throw new Error(validation.message);

            const saved = payload._id ? await PhaseApi.update(payload) : await PhaseApi.create(payload);
            
            toast.current?.show({ severity: "success", summary: "Success", detail: "Phase saved" });
            if (onComplete) onComplete(saved);
        } catch (err: any) {
            toast.current?.show({ severity: "error", summary: "Error", detail: err.message });
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <Dialog visible={visible} style={{ width: "800px" }} header="Phase" modal className="p-fluid" onHide={onHide}
                footer={<div className="flex justify-content-end gap-2">
                    <Button label="Cancel" icon="pi pi-times" text onClick={onHide} />
                    <Button label="Save Changes" icon="pi pi-check" onClick={handleSave} />
                </div>}
            >
                {/* Mode Selector */}
                <div className="flex justify-content-center mb-4">
                    <SelectButton value={mode} options={modeOptions} onChange={(e) => setMode(e.value || 'simple')} unselectable={false} />
                </div>

                <div className="grid">
                    <div className="field col-12 md:col-2">
                        <label className="font-bold">Order</label>
                        <InputNumber value={localPhase.order} onValueChange={(e) => updateField("order", e.value)} min={1} />
                    </div>
                    <div className="field col-12 md:col-10">
                        <label className="font-bold">Phase Description</label>
                        <InputText value={localPhase.description} onChange={(e) => updateField("description", e.target.value)} />
                    </div>
                </div>

                {/* SIMPLE MODE: Manual Input */}
                {mode === 'simple' && (
                    <div className="grid fadein">
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-primary">Total Duration (Days)</label>
                            <InputNumber value={localPhase.duration} onValueChange={(e) => updateField("duration", e.value)} />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="font-bold text-primary">Total Budget (ETB)</label>
                            <InputNumber value={localPhase.budget} onValueChange={(e) => updateField("budget", e.value)} mode="currency" currency="ETB" />
                        </div>
                    </div>
                )}

                {/* DETAILED MODE: Table Input */}
                {mode === 'detailed' && (
                    <div className="fadein">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <span className="text-sm text-gray-600 italic">Work Breakdowns.</span>
                            <Button label="Add Activity" icon="pi pi-plus" size="small" severity="secondary" text onClick={addActivity} />
                        </div>
                        
                        <DataTable value={localPhase.breakdown} scrollable scrollHeight="200px" className="border-1 surface-border">
                            <Column header="Activity" body={(_, opt) => (
                                <InputText value={localPhase.breakdown[opt.rowIndex].activity} 
                                    onChange={(e) => {
                                        const b = [...localPhase.breakdown];
                                        b[opt.rowIndex].activity = e.target.value;
                                        updateField("breakdown", b);
                                    }} />
                            )} />
                            <Column header="Days" body={(_, opt) => (
                                <InputNumber value={localPhase.breakdown[opt.rowIndex].duration} 
                                    onValueChange={(e) => {
                                        const b = [...localPhase.breakdown];
                                        b[opt.rowIndex].duration = e.value || 0;
                                        syncTotals(b);
                                    }} />
                            )} />
                            <Column header="Budget" body={(_, opt) => (
                                <InputNumber value={localPhase.breakdown[opt.rowIndex].budget} 
                                    onValueChange={(e) => {
                                        const b = [...localPhase.breakdown];
                                        b[opt.rowIndex].budget = e.value || 0;
                                        syncTotals(b);
                                    }} mode="currency" currency="ETB" />
                            )} />
                            <Column body={(_, opt) => (
                                <Button icon="pi pi-trash" severity="danger" text onClick={() => {
                                    const b = localPhase.breakdown.filter((_, i) => i !== opt.rowIndex);
                                    syncTotals(b);
                                }} />
                            )} />
                        </DataTable>

                        <div className="mt-3 p-3 surface-ground border-round flex justify-content-between font-bold">
                            <span>Calculated Total:</span>
                            <span>{localPhase.duration} Days | {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(localPhase.budget)}</span>
                        </div>
                    </div>
                )}
            </Dialog>
        </>
    );
};

export default SavePhase;