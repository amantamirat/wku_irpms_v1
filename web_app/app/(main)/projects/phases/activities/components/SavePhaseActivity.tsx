'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { PhaseActivityApi } from '../api/phase-activity.api';
import { PhaseActivity, validatePhaseActivity } from '../models/phase-activity.model';
import { computeDurationFromDates } from './PhaseActivityManager';
import { etbCurrencyFormatter } from '@/utils/utils';

const SavePhaseActivity = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<PhaseActivity>) => {
    const [localActivity, setLocalActivity] = useState<PhaseActivity>({
        ...item,
        startDate: item?.startDate ? new Date(item.startDate) : undefined,
        endDate: item?.endDate ? new Date(item.endDate) : undefined,
        detailCost: item?.detailCost ? { ...item.detailCost } : undefined,
        cost: item?.cost ?? 0
    });
    
    // Toggle state for whether detailed cost breakdown is enabled
    const [hasDetailCost, setHasDetailCost] = useState<boolean>(!!item?.detailCost);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLocalActivity({
            ...item,
            startDate: item?.startDate ? new Date(item.startDate) : undefined,
            endDate: item?.endDate ? new Date(item.endDate) : undefined,
            detailCost: item?.detailCost ? { ...item.detailCost } : undefined,
            cost: item?.cost ?? 0
        });
        setHasDetailCost(!!item?.detailCost);
        setSubmitted(false);
    }, [item]);

    // Handle date changes
    const handleDateChange = (field: 'startDate' | 'endDate', value: Date | null) => {
        const startDate = field === 'startDate' ? (value ?? undefined) : localActivity.startDate;
        const endDate = field === 'endDate' ? (value ?? undefined) : localActivity.endDate;

        let updated = { ...localActivity, startDate, endDate };

        // If detail cost is active, optionally auto-sync duration if desired, or keep independent
        setLocalActivity(updated);
    };

    // Toggle detail cost breakdown on/off
    const handleToggleDetailCost = (checked: boolean) => {
        setHasDetailCost(checked);
        if (checked) {
            const defaultDetail = { duration: 1, participants: 1, unitPrice: 0 };
            setLocalActivity({
                ...localActivity,
                detailCost: defaultDetail,
                cost: 1 * 1 * 0
            });
        } else {
            // Remove detailCost so cost becomes manually editable
            const { detailCost, ...rest } = localActivity;
            setLocalActivity(rest);
        }
    };

    // Handle changes to detail cost fields and auto-calculate total cost
    const handleDetailCostChange = (field: 'duration' | 'participants' | 'unitPrice', value: number) => {
        if (!localActivity.detailCost) return;
        const updatedDetailCost = { ...localActivity.detailCost, [field]: value };

        const duration = updatedDetailCost.duration ?? 1;
        const participants = updatedDetailCost.participants ?? 1;
        const unitPrice = updatedDetailCost.unitPrice ?? 0;
        const calculatedCost = duration * participants * unitPrice;

        setLocalActivity({
            ...localActivity,
            detailCost: updatedDetailCost,
            cost: calculatedCost
        });
    };

    const handleSave = async () => {
        setSubmitted(true);

        const validation = validatePhaseActivity(localActivity);
        if (!validation.valid) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Validation Error',
                detail: validation.message,
                life: 3000
            });
            return;
        }

        setSaving(true);

        try {
            const apiMethod = localActivity._id ? PhaseActivityApi.update : PhaseActivityApi.create;
            const saved = await apiMethod(localActivity);

            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Phase activity saved successfully',
                life: 2000
            });

            onComplete?.(saved);
        } catch (err: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Save Failed',
                detail: err.message || String(err),
                life: 3000
            });
        } finally {
            setSaving(false);
        }
    };

    const timelineDuration = computeDurationFromDates(localActivity.startDate, localActivity.endDate);

    const footer = (
        <div className="flex justify-content-end gap-2 pt-3 border-top-1 surface-border">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text p-button-secondary"
            />
            <Button
                label="Save Activity"
                icon="pi pi-check"
                onClick={handleSave}
                loading={saving}
            />
        </div>
    );

    return (
        <>
            <Toast ref={toast} />

            <Dialog
                visible={visible}
                style={{ width: '750px' }}
                breakpoints={{ '960px': '75vw', '641px': '95vw' }}
                header={
                    <div className="flex align-items-center gap-2">
                        <div className="bg-primary-subtle p-2 border-round flex align-items-center justify-content-center">
                            <i className="pi pi-check-square text-primary text-xl"></i>
                        </div>
                        <div>
                            <span className="text-xl font-bold">
                                {localActivity._id ? 'Edit Phase Activity' : 'New Phase Activity'}
                            </span>
                            <div className="text-sm text-color-secondary font-normal">
                                Configure activity details, timeline, and cost.
                            </div>
                        </div>
                    </div>
                }
                modal
                footer={footer}
                onHide={onHide}
                contentClassName="p-4 surface-ground"
            >
                <div className="p-fluid grid formgrid">
                    
                    {/* SECTION 1: Basic Information */}
                    <div className="col-12 bg-white p-3 border-round shadow-1 mb-3 surface-border">
                        <div className="font-bold text-primary mb-3 flex align-items-center gap-2">
                            <i className="pi pi-info-circle"></i> Basic Information
                        </div>
                        <div className="grid formgrid">
                            <div className="field col-12 mb-3">
                                <label htmlFor="title" className="font-semibold block mb-2">
                                    Activity Title <span className="text-red-500">*</span>
                                </label>
                                <InputText
                                    id="title"
                                    value={localActivity.title || ''}
                                    onChange={(e) =>
                                        setLocalActivity({ ...localActivity, title: e.target.value })
                                    }
                                    placeholder="e.g., Requirements Gathering & Analysis"
                                    className={classNames({ 'p-invalid': submitted && !localActivity.title })}
                                />
                                {submitted && !localActivity.title && (
                                    <small className="p-error">Title is required.</small>
                                )}
                            </div>

                            <div className="field col-12 mb-0">
                                <label htmlFor="description" className="font-semibold block mb-2">Description</label>
                                <InputTextarea
                                    id="description"
                                    rows={2}
                                    value={localActivity.description || ''}
                                    onChange={(e) =>
                                        setLocalActivity({ ...localActivity, description: e.target.value })
                                    }
                                    placeholder="Detailed outline of tasks involved..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Timeline */}
                    <div className="col-12 bg-white p-3 border-round shadow-1 mb-3 surface-border">
                        <div className="font-bold text-primary mb-3 flex align-items-center justify-content-between">
                            <span className="flex align-items-center gap-2">
                                <i className="pi pi-calendar"></i> Timeline
                            </span>
                            <span className="text-sm bg-primary-subtle text-primary px-2 py-1 border-round font-medium">
                                <i className="pi pi-clock mr-1"></i> Span: {timelineDuration} {timelineDuration === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                        <div className="grid formgrid">
                            <div className="field col-12 md:col-6 mb-3 md:mb-0">
                                <label htmlFor="startDate" className="font-semibold block mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    id="startDate"
                                    value={localActivity.startDate ?? null}
                                    onChange={(e) => handleDateChange('startDate', e.value as Date)}
                                    showIcon
                                    dateFormat="yy-mm-dd"
                                    placeholder="Select start date"
                                    className={classNames({ 'p-invalid': submitted && !localActivity.startDate })}
                                />
                                {submitted && !localActivity.startDate && (
                                    <small className="p-error">Start Date is required.</small>
                                )}
                            </div>

                            <div className="field col-12 md:col-6 mb-0">
                                <label htmlFor="endDate" className="font-semibold block mb-2">
                                    End Date <span className="text-red-500">*</span>
                                </label>
                                <Calendar
                                    id="endDate"
                                    value={localActivity.endDate ?? null}
                                    onChange={(e) => handleDateChange('endDate', e.value as Date)}
                                    showIcon
                                    dateFormat="yy-mm-dd"
                                    minDate={localActivity.startDate}
                                    placeholder="Select end date"
                                    className={classNames({ 'p-invalid': submitted && !localActivity.endDate })}
                                />
                                {submitted && !localActivity.endDate && (
                                    <small className="p-error">End Date is required.</small>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Cost & Optional Breakdown */}
                    <div className="col-12 bg-white p-3 border-round shadow-1 mb-0 surface-border">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <div className="font-bold text-primary flex align-items-center gap-2">
                                <i className="pi pi-wallet"></i> Financials
                            </div>
                            <div className="flex align-items-center gap-2">
                                <Checkbox
                                    inputId="enableDetailCost"
                                    checked={hasDetailCost}
                                    onChange={(e) => handleToggleDetailCost(e.checked ?? false)}
                                />
                                <label htmlFor="enableDetailCost" className="cursor-pointer text-sm font-semibold select-none">
                                    Enable Detailed Calculation
                                </label>
                            </div>
                        </div>

                        <div className="grid formgrid">
                            {hasDetailCost && localActivity.detailCost ? (
                                <>
                                    <div className="field col-12 md:col-4 mb-3 md:mb-0">
                                        <label htmlFor="detailDuration" className="font-semibold block mb-2">
                                            Detail Duration <span className="text-red-500">*</span>
                                        </label>
                                        <InputNumber
                                            id="detailDuration"
                                            value={localActivity.detailCost.duration}
                                            onValueChange={(e) => handleDetailCostChange('duration', e.value ?? 1)}
                                            useGrouping={false}
                                            min={1}
                                        />
                                    </div>

                                    <div className="field col-12 md:col-4 mb-3 md:mb-0">
                                        <label htmlFor="participants" className="font-semibold block mb-2">
                                            Participants <span className="text-red-500">*</span>
                                        </label>
                                        <InputNumber
                                            id="participants"
                                            value={localActivity.detailCost.participants}
                                            onValueChange={(e) => handleDetailCostChange('participants', e.value ?? 1)}
                                            useGrouping={false}
                                            min={1}
                                        />
                                    </div>

                                    <div className="field col-12 md:col-4 mb-3 md:mb-0">
                                        <label htmlFor="unitPrice" className="font-semibold block mb-2">
                                            Unit Price (ETB) <span className="text-red-500">*</span>
                                        </label>
                                        <InputNumber
                                            id="unitPrice"
                                            value={localActivity.detailCost.unitPrice}
                                            onValueChange={(e) => handleDetailCostChange('unitPrice', e.value ?? 0)}
                                            mode="currency"
                                            currency="ETB"
                                            min={0}
                                        />
                                    </div>

                                    <div className="col-12 mt-2 pt-3 border-top-1 surface-border flex align-items-center justify-content-between">
                                        <div>
                                            <span className="text-sm text-color-secondary block font-semibold">Calculated Total Cost</span>
                                            <span className="text-xs text-500">
                                                ({localActivity.detailCost.duration} days &times; {localActivity.detailCost.participants} participants &times; {etbCurrencyFormatter.format(localActivity.detailCost.unitPrice)})
                                            </span>
                                        </div>
                                        <div className="text-xl font-bold text-green-700 font-mono">
                                            {etbCurrencyFormatter.format(localActivity.cost ?? 0)}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="field col-12 mb-0">
                                    <label htmlFor="cost" className="font-semibold block mb-2">
                                        Total Cost (ETB) <span className="text-red-500">*</span>
                                    </label>
                                    <InputNumber
                                        id="cost"
                                        value={localActivity.cost ?? 0}
                                        onValueChange={(e) => setLocalActivity({ ...localActivity, cost: e.value ?? 0 })}
                                        mode="currency"
                                        currency="ETB"
                                        min={0}
                                        placeholder="Enter total cost manually"
                                        className={classNames({ 'p-invalid': submitted && (localActivity.cost === undefined || localActivity.cost < 0) })}
                                    />
                                    {submitted && (localActivity.cost === undefined || localActivity.cost < 0) && (
                                        <small className="p-error">Valid cost is required.</small>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </Dialog>
        </>
    );
};

export default SavePhaseActivity;