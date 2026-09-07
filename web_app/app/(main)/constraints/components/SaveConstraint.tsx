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
import { IRange } from '@/types/range';

// Helper to initialize constraint state with nested range structures
const initializeConstraint = (item?: Partial<Constraint>): Constraint => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    participants: item?.participants ? { ...item.participants } : undefined,
    phases: item?.phases ? { ...item.phases } : undefined,
    budget: item?.budget ? { ...item.budget } : undefined,
    duration: item?.duration ? { ...item.duration } : undefined,
    budgetPerPhase: item?.budgetPerPhase ? { ...item.budgetPerPhase } : undefined,
    durationPerPhase: item?.durationPerPhase ? { ...item.durationPerPhase } : undefined,
    themes: item?.themes ? { ...item.themes } : undefined,
    subThemes: item?.subThemes ? { ...item.subThemes } : undefined,
    focusAreas: item?.focusAreas ? { ...item.focusAreas } : undefined,
    indicators: item?.indicators ? { ...item.indicators } : undefined,
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
            [field]: value
        }));
    };

    const updateRangeField = (
        rangeKey: keyof Constraint,
        bound: 'min' | 'max',
        value: number | null | undefined
    ) => {
        setLocalConstraint((prev) => {
            const currentRange = (prev[rangeKey] as IRange | undefined) || { min: 0, max: 0 };
            const updatedRange: Partial<IRange> = {
                ...currentRange,
                [bound]: value ?? undefined
            };

            // Remove range property if both bounds are cleared/empty
            if (updatedRange.min === undefined && updatedRange.max === undefined) {
                const copy = { ...prev };
                delete copy[rangeKey];
                return copy;
            }

            return {
                ...prev,
                [rangeKey]: updatedRange as IRange
            };
        });
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
        rangeKey: keyof Constraint,
        isCurrency: boolean = false
    ) => {
        const range = localConstraint[rangeKey] as IRange | undefined;

        return (
            <div className="col-12 md:col-6 mb-3">
                <label className="font-bold block mb-2">{label}</label>
                <div className="flex gap-2 align-items-center">
                    <InputNumber
                        value={range?.min ?? null}
                        onValueChange={(e) => updateRangeField(rangeKey, 'min', e.value)}
                        placeholder="Min"
                        mode={isCurrency ? 'currency' : 'decimal'}
                        currency={isCurrency ? 'ETB' : undefined}
                        locale="en-ET"
                        className="w-full"
                    />
                    <span className="text-500">-</span>
                    <InputNumber
                        value={range?.max ?? null}
                        onValueChange={(e) => updateRangeField(rangeKey, 'max', e.value)}
                        placeholder="Max"
                        mode={isCurrency ? 'currency' : 'decimal'}
                        currency={isCurrency ? 'ETB' : undefined}
                        locale="en-ET"
                        className="w-full"
                    />
                </div>
            </div>
        );
    };

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
                    {renderRangeInputs('Participants', 'participants')}
                    {renderRangeInputs('Phases Count', 'phases')}
                    {renderRangeInputs('Project Budget', 'budget', true)}
                    {renderRangeInputs('Project Duration (Days)', 'duration')}
                    {renderRangeInputs('Budget per Phase', 'budgetPerPhase', true)}
                    {renderRangeInputs('Duration per Phase (Days)', 'durationPerPhase')}
                    {renderRangeInputs('Themes', 'themes')}
                    {renderRangeInputs('Sub Themes', 'subThemes')}
                    {renderRangeInputs('Focus Areas', 'focusAreas')}
                    {renderRangeInputs('Indicators', 'indicators')}
                </div>
            </Dialog>
        </>
    );
};

export default SaveConstraint;