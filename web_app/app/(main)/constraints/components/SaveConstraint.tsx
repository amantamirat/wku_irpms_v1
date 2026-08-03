'use client';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';
import { useEffect, useRef, useState } from 'react';
import { ConstraintApi } from '../api/constraint.api';
import { Constraint, validateConstraint } from '../models/constraint.model';
import { EntitySaveDialogProps } from '@/components/createEntityManager';

// Helper to initialize missing/optional fields explicitly
const initializeConstraint = (item?: Partial<Constraint>): Constraint => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    minParticipants: item?.minParticipants ?? undefined,
    maxParticipants: item?.maxParticipants ?? undefined,
    minPhases: item?.minPhases ?? undefined,
    maxPhases: item?.maxPhases ?? undefined,
    minBudget: item?.minBudget ?? undefined,
    maxBudget: item?.maxBudget ?? undefined,
    minDuration: item?.minDuration ?? undefined,
    maxDuration: item?.maxDuration ?? undefined,
    minBudgetPerPhase: item?.minBudgetPerPhase ?? undefined,
    maxBudgetPerPhase: item?.maxBudgetPerPhase ?? undefined,
    minDurationPerPhase: item?.minDurationPerPhase ?? undefined,
    maxDurationPerPhase: item?.maxDurationPerPhase ?? undefined,
    minThemes: item?.minThemes ?? undefined,
    maxThemes: item?.maxThemes ?? undefined,
    minSubThemes: item?.minSubThemes ?? undefined,
    maxSubThemes: item?.maxSubThemes ?? undefined,
    minFocusAreas: item?.minFocusAreas ?? undefined,
    maxFocusAreas: item?.maxFocusAreas ?? undefined,
    minIndicators: item?.minIndicators ?? undefined,
    maxIndicators: item?.maxIndicators ?? undefined,
    createdAt: item?.createdAt,
    updatedAt: item?.updatedAt,
});

const SaveConstraint = ({ visible, item, onComplete, onHide }: EntitySaveDialogProps<Constraint>) => {
    const [localConstraint, setLocalConstraint] = useState<Constraint>(() => initializeConstraint(item));
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLocalConstraint(initializeConstraint(item));
    }, [item]);

    const updateField = (field: keyof Constraint, value: any) => {
        setLocalConstraint((prev) => ({
            ...prev,
            [field]: value ?? undefined
        }));
    };

    const saveConstraint = async () => {
        setSubmitted(true);
        try {
            const validation = validateConstraint(localConstraint);
            if (!validation.valid) throw new Error(validation.message);

            const saved = localConstraint._id
                ? await ConstraintApi.update(localConstraint)
                : await ConstraintApi.create(localConstraint);

            toast.current?.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Constraint saved successfully',
                life: 1000,
            });

            if (onComplete) setTimeout(() => onComplete(saved), 1000);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: err.message || 'Failed to save constraint',
                life: 2000,
            });
        } finally {
            setSubmitted(false);
        }
    };

    const hide = () => {
        setSubmitted(false);
        onHide();
    };

    const renderRangeInputs = (
        label: string,
        minKey: keyof Constraint,
        maxKey: keyof Constraint,
        isCurrency: boolean = false
    ) => (
        <div className="col-12 md:col-6 mb-3">
            <label className="font-bold block mb-2">{label}</label>
            <div className="flex gap-2 align-items-center">
                <InputNumber
                    value={(localConstraint[minKey] as number) ?? null}
                    onValueChange={(e) => updateField(minKey, e.value)}
                    placeholder="Min"
                    mode={isCurrency ? 'currency' : 'decimal'}
                    currency={isCurrency ? 'ETB' : undefined}
                    locale="en-ET"
                    className="w-full"
                />
                <span className="text-500">-</span>
                <InputNumber
                    value={(localConstraint[maxKey] as number) ?? null}
                    onValueChange={(e) => updateField(maxKey, e.value)}
                    placeholder="Max"
                    mode={isCurrency ? 'currency' : 'decimal'}
                    currency={isCurrency ? 'ETB' : undefined}
                    locale="en-ET"
                    className="w-full"
                />
            </div>
        </div>
    );

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" icon="pi pi-times" outlined onClick={hide} severity="secondary" />
            <Button label="Save Constraint" icon="pi pi-check" onClick={saveConstraint} loading={submitted} />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />
            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                header={localConstraint._id ? 'Edit Constraint Profile' : 'Define New Constraint Profile'}
                modal
                maximizable
                className="p-fluid"
                footer={footer}
                onHide={hide}
            >
                {/* General Info */}
                <div className="field mb-3">
                    <label htmlFor="name" className="font-bold">Constraint Profile Name *</label>
                    <InputText
                        id="name"
                        value={localConstraint.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="e.g., Standard Research Grant Limits"
                        className={classNames({ 'p-invalid': submitted && (!localConstraint.name || !localConstraint.name.trim()) })}
                    />
                    {submitted && (!localConstraint.name || !localConstraint.name.trim()) && (
                        <small className="p-error">Constraint name is required.</small>
                    )}
                </div>

                <div className="field mb-4">
                    <label htmlFor="description" className="font-bold">Description</label>
                    <InputTextarea
                        id="description"
                        value={localConstraint.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={2}
                        placeholder="Optional details or context regarding this constraint profile..."
                    />
                </div>

                <h5 className="mb-3 text-700 border-bottom-1 surface-border pb-2">Constraint Ranges</h5>

                <div className="grid">
                    {renderRangeInputs('Participants', 'minParticipants', 'maxParticipants')}
                    {renderRangeInputs('Phases Count', 'minPhases', 'maxPhases')}
                    {renderRangeInputs('Project Budget', 'minBudget', 'maxBudget', true)}
                    {renderRangeInputs('Project Duration (Days)', 'minDuration', 'maxDuration')}
                    {renderRangeInputs('Budget per Phase', 'minBudgetPerPhase', 'maxBudgetPerPhase', true)}
                    {renderRangeInputs('Duration per Phase (Days)', 'minDurationPerPhase', 'maxDurationPerPhase')}
                    {renderRangeInputs('Themes', 'minThemes', 'maxThemes')}
                    {renderRangeInputs('Sub Themes', 'minSubThemes', 'maxSubThemes')}
                    {renderRangeInputs('Focus Areas', 'minFocusAreas', 'maxFocusAreas')}
                    {renderRangeInputs('Indicators', 'minIndicators', 'maxIndicators')}
                </div>
            </Dialog>
        </>
    );
};

export default SaveConstraint;