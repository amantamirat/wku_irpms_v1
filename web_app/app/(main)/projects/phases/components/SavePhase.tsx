'use client';
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useEffect, useRef, useState } from "react";
import { PhaseApi } from "../api/phase.api";
import { Phase, validatePhase, PhaseBreakdown } from "../models/phase.model";
import { EntitySaveDialogProps } from '@/components/createEntityManager';

const SavePhase = ({ visible, item: phase, onHide, onComplete }: EntitySaveDialogProps<Phase>) => {
    const [localPhase, setLocalPhase] = useState<Phase>({ ...phase, breakdown: phase.breakdown || [] });
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (visible) {
            // Ensure breakdown is initialized and totals are synced on open
            const initialBreakdown = phase.breakdown || [];
            syncTotals(initialBreakdown);
        }
    }, [visible, phase]);

    const updateField = (field: keyof Phase, value: any) => {
        setLocalPhase(prev => ({ ...prev, [field]: value }));
    };

    // Recalculates duration and budget based on activities
    const syncTotals = (breakdown: PhaseBreakdown[]) => {
        const totalDuration = breakdown.reduce((sum, b) => sum + (b.duration || 0), 0);
        const totalBudget = breakdown.reduce((sum, b) => sum + (b.budget || 0), 0);

        setLocalPhase(prev => ({
            ...prev,
            breakdown,
            duration: totalDuration,
            budget: totalBudget
        }));
    };

    const addActivity = () => {
        const updated = [...(localPhase.breakdown || []), { activity: '', duration: 0, budget: 0 }];
        syncTotals(updated);
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
                style={{ width: "850px" }}
                header="Phase Details & Activities"
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
                    <div className="field col-12 md:col-2">
                        <label className="font-bold">Order</label>
                        <InputNumber value={localPhase.order} onValueChange={(e) => updateField("order", e.value)} min={1} />
                    </div>
                    <div className="field col-12 md:col-10">
                        <label className="font-bold">Phase Description</label>
                        <InputText value={localPhase.description} onChange={(e) => updateField("description", e.target.value)} placeholder="e.g. Foundation Work" />
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex justify-content-between align-items-center mb-2">
                        <h5 className="m-0">Work Breakdown Structure</h5>
                        <Button
                            label="Add Activity"
                            icon="pi pi-plus"
                            size="small"
                            text
                            onClick={addActivity}
                        />
                    </div>

                    <DataTable value={localPhase.breakdown} scrollable scrollHeight="300px" className="border-1 surface-border">
                        <Column header="Activity Description" body={(_, opt) => (
                            <InputText
                                value={localPhase.breakdown[opt.rowIndex].activity}
                                onChange={(e) => {
                                    const b = [...localPhase.breakdown];
                                    b[opt.rowIndex].activity = e.target.value;
                                    updateField("breakdown", b);
                                }}
                                placeholder="Activity name"
                            />
                        )} style={{ width: '40%' }} />

                        <Column header="Duration (Days)" body={(_, opt) => (
                            <InputNumber
                                value={localPhase.breakdown[opt.rowIndex].duration}
                                onValueChange={(e) => {
                                    const b = [...localPhase.breakdown];
                                    b[opt.rowIndex].duration = e.value || 0;
                                    syncTotals(b);
                                }}
                            />
                        )} />

                        <Column header="Budget (ETB)" body={(_, opt) => (
                            <InputNumber
                                value={localPhase.breakdown[opt.rowIndex].budget}
                                onValueChange={(e) => {
                                    const b = [...localPhase.breakdown];
                                    b[opt.rowIndex].budget = e.value || 0;
                                    syncTotals(b);
                                }}
                                mode="currency"
                                currency="ETB"
                            />
                        )} />

                        <Column body={(_, opt) => (
                            <Button
                                icon="pi pi-trash"
                                severity="danger"
                                text
                                onClick={() => {
                                    const b = localPhase.breakdown.filter((_, i) => i !== opt.rowIndex);
                                    syncTotals(b);
                                }}
                            />
                        )} style={{ width: '3rem' }} />
                    </DataTable>

                    {/* Summary Footer */}
                    <div className="mt-3 p-3 surface-100 border-round flex justify-content-between align-items-center shadow-1">
                        <span className="text-xl font-bold">Phase Totals:</span>
                        <div className="flex gap-4">
                            <div className="flex flex-column align-items-end">
                                <small className="text-600">Total Duration</small>
                                <span className="text-lg font-bold text-primary">{localPhase.duration} Days</span>
                            </div>
                            <div className="flex flex-column align-items-end">
                                <small className="text-600">Total Budget</small>
                                <span className="text-lg font-bold text-primary">
                                    {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB' }).format(localPhase.budget || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SavePhase;