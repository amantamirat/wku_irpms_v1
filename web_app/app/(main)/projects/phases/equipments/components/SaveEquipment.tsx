'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { classNames } from 'primereact/utils';

import { EntitySaveDialogProps } from '@/components/createEntityManager';
import { PhaseEquipmentApi } from '../api/phase-equipment.api';
import { PhaseEquipment, EquipmentUnit, PhaseEquipmentStatus, validatePhaseEquipment } from '../models/phase-equipment.model';

const SaveEquipment = ({
    visible,
    item,
    onComplete,
    onHide
}: EntitySaveDialogProps<PhaseEquipment>) => {
    const [localEquipment, setLocalEquipment] = useState<PhaseEquipment>({
        ...item,
        unit: item?.unit ?? EquipmentUnit.number,
        quantity: item?.quantity ?? 1,
        unitPrice: item?.unitPrice ?? 0,
        status: item?.status ?? PhaseEquipmentStatus.planned
    });
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        setLocalEquipment({
            ...item,
            unit: item?.unit ?? EquipmentUnit.number,
            quantity: item?.quantity ?? 1,
            unitPrice: item?.unitPrice ?? 0,
            status: item?.status ?? PhaseEquipmentStatus.planned
        });
        setSubmitted(false);
    }, [item]);

    const unitOptions = Object.values(EquipmentUnit).map((unit) => ({
        label: unit.charAt(0).toUpperCase() + unit.slice(1),
        value: unit
    }));

    const statusOptions = Object.values(PhaseEquipmentStatus).map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status
    }));

    const handleSave = async () => {
        setSubmitted(true);

        const validation = validatePhaseEquipment(localEquipment);
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
            const apiMethod = localEquipment._id ? PhaseEquipmentApi.update : PhaseEquipmentApi.create;
            const saved = await apiMethod(localEquipment);

            toast.current?.show({
                severity: 'success',
                summary: 'Successful',
                detail: 'Phase equipment saved successfully',
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
                label="Save Equipment"
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
                            <i className="pi pi-box text-primary text-xl"></i>
                        </div>
                        <div>
                            <span className="text-xl font-bold">
                                {localEquipment._id ? 'Edit Equipment' : 'New Equipment'}
                            </span>
                            <div className="text-sm text-color-secondary font-normal">
                                Configure description, units, pricing, and status.
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
                    {/* Description */}
                    <div className="field col-12 mb-3">
                        <label htmlFor="description" className="font-bold block mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <InputText
                            id="description"
                            value={localEquipment.description || ''}
                            onChange={(e) =>
                                setLocalEquipment({ ...localEquipment, description: e.target.value })
                            }
                            placeholder="e.g., Safety Helmets"
                            className={classNames({ 'p-invalid': submitted && !localEquipment.description })}
                        />
                        {submitted && !localEquipment.description && (
                            <small className="p-error">Description is required.</small>
                        )}
                    </div>

                    {/* Unit & Quantity */}
                    <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="unit" className="font-bold block mb-2">
                            Unit <span className="text-red-500">*</span>
                        </label>
                        <Dropdown
                            id="unit"
                            value={localEquipment.unit}
                            options={unitOptions}
                            onChange={(e) => setLocalEquipment({ ...localEquipment, unit: e.value })}
                            placeholder="Select unit"
                            className={classNames({ 'p-invalid': submitted && !localEquipment.unit })}
                        />
                    </div>

                    <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="quantity" className="font-bold block mb-2">
                            Quantity <span className="text-red-500">*</span>
                        </label>
                        <InputNumber
                            id="quantity"
                            value={localEquipment.quantity ?? 1}
                            onValueChange={(e) => setLocalEquipment({ ...localEquipment, quantity: e.value ?? 1 })}
                            useGrouping={false}
                            min={1}
                            placeholder="e.g., 10"
                            className={classNames({ 'p-invalid': submitted && (localEquipment.quantity === undefined || localEquipment.quantity <= 0) })}
                        />
                    </div>

                    {/* Unit Price & Status */}
                    <div className="field col-12 md:col-6 mb-3">
                        <label htmlFor="unitPrice" className="font-bold block mb-2">
                            Unit Price (ETB)
                        </label>
                        <InputNumber
                            id="unitPrice"
                            value={localEquipment.unitPrice ?? 0}
                            onValueChange={(e) => setLocalEquipment({ ...localEquipment, unitPrice: e.value ?? 0 })}
                            mode="currency"
                            currency="ETB"
                            min={0}
                        />
                    </div>
                    {
                        /**
                         * <div className="field col-12 md:col-6 mb-3">
                                            <label htmlFor="status" className="font-bold block mb-2">
                                                Status
                                            </label>
                                            <Dropdown
                                                id="status"
                                                value={localEquipment.status}
                                                options={statusOptions}
                                                onChange={(e) => setLocalEquipment({ ...localEquipment, status: e.value })}
                                                placeholder="Select status"
                                            />
                                        </div>
                         */
                    }

                </div>
            </Dialog>
        </>
    );
};

export default SaveEquipment;