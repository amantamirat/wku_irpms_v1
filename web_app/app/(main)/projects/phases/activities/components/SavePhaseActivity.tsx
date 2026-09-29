'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { PhaseActivityApi } from '../api/phase-activity.api';
import { PhaseActivity, validatePhaseActivity } from '../models/phase-activity.model';

const SavePhaseActivity = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<PhaseActivity>) => {
    // Parse date strings back into Date objects for the Calendar component if they exist
    const [localActivity, setLocalActivity] = useState<PhaseActivity>({
        ...item,
        startDate: item?.startDate ? new Date(item.startDate) : undefined,
        endDate: item?.endDate ? new Date(item.endDate) : undefined
    });
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLocalActivity({
            ...item,
            startDate: item?.startDate ? new Date(item.startDate) : undefined,
            endDate: item?.endDate ? new Date(item.endDate) : undefined
        });
        setSubmitted(false);
    }, [item]);

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
                style={{ width: '700px' }}
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
                                Configure timeline dates, participants, and financial costs.
                            </div>
                        </div>
                    </div>
                }
                modal
                footer={footer}
                onHide={onHide}
                contentClassName="p-4 surface-ground"
            >
                <div className="p-fluid grid formgrid bg-white p-4 border-round shadow-1 surface-border">
                    {/* Title */}
                    <div className="field col-12 mb-3">
                        <label htmlFor="title" className="font-bold block mb-2">
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

                    {/* Start Date & End Date */}
                    <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="startDate" className="font-bold block mb-2">
                            Start Date <span className="text-red-500">*</span>
                        </label>
                        <Calendar
                            id="startDate"
                            value={localActivity.startDate ?? null}
                            onChange={(e) => setLocalActivity({ ...localActivity, startDate: e.value as Date })}
                            showIcon
                            dateFormat="yy-mm-dd"
                            placeholder="Select start date"
                            className={classNames({ 'p-invalid': submitted && !localActivity.startDate })}
                        />
                        {submitted && !localActivity.startDate && (
                            <small className="p-error">Start Date is required.</small>
                        )}
                    </div>

                    <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="endDate" className="font-bold block mb-2">
                            End Date <span className="text-red-500">*</span>
                        </label>
                        <Calendar
                            id="endDate"
                            value={localActivity.endDate ?? null}
                            onChange={(e) => setLocalActivity({ ...localActivity, endDate: e.value as Date })}
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

                    {/* Cost & Participants Count */}
                    <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="cost" className="font-bold block mb-2">
                            Cost (ETB) <span className="text-red-500">*</span>
                        </label>
                        <InputNumber
                            id="cost"
                            value={localActivity.cost ?? 0}
                            onValueChange={(e) => setLocalActivity({ ...localActivity, cost: e.value ?? 0 })}
                            mode="currency"
                            currency="ETB"
                            className={classNames({ 'p-invalid': submitted && localActivity.cost === undefined })}
                        />
                    </div>

                    <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="participants" className="font-bold block mb-2">Participants Count</label>
                        <InputNumber
                            id="participants"
                            value={localActivity.participants ?? 0}
                            onValueChange={(e) => setLocalActivity({ ...localActivity, participants: e.value ?? 0 })}
                            useGrouping={false}
                            min={0}
                            placeholder="e.g., 3"
                        />
                    </div>

                    {/* Description */}
                    <div className="field col-12 mb-1">
                        <label htmlFor="description" className="font-bold block mb-2">Description</label>
                        <InputTextarea
                            id="description"
                            rows={3}
                            value={localActivity.description || ''}
                            onChange={(e) =>
                                setLocalActivity({ ...localActivity, description: e.target.value })
                            }
                            placeholder="Detailed outline of tasks involved in this activity..."
                        />
                    </div>
                </div>
            </Dialog>
        </>
    );
};

export default SavePhaseActivity;