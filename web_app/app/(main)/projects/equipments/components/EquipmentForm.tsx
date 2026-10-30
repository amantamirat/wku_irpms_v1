'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Project } from '@/app/(main)/projects/models/project.model';
import {
    PhaseEquipment,
    EquipmentUnit,
    validatePhaseEquipment
} from '../models/phase-equipment.model';

import { Phase } from '../../phases/models/phase.model';
import { PhaseApi } from '../../phases/api/phase.api';

import { etbCurrencyFormatter, extractId } from '@/utils/utils';

interface EquipmentFormProps extends ItemFormRenderProps<PhaseEquipment> {
    project?: Project | string | null;
    phase?: Phase | string | null;
}

const EquipmentForm = ({
    item,
    saving,
    formId,
    onSubmit,
    project,
    phase
}: EquipmentFormProps) => {
    const [localItem, setLocalItem] = useState<PhaseEquipment>({
        ...(item ?? {}),
        project: project ?? item?.project ?? undefined,
        phase: phase ?? item?.phase ?? undefined,
        itemName: item?.itemName ?? '',
        description: item?.description ?? '',
        unit: item?.unit ?? EquipmentUnit.number,
        packSize:
            item?.unit === EquipmentUnit.number || !item?.unit
                ? 1
                : item?.packSize ?? 1,
        quantity: item?.quantity ?? 1,
        unitPrice: item?.unitPrice ?? 0
    } as PhaseEquipment);

    const [phases, setPhases] = useState<Phase[]>([]);
    const [loadingPhases, setLoadingPhases] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const projectId = extractId(localItem.project);
    const phaseId = extractId(localItem.phase);
    const phaseLocked = phase != null;

    // Reset form values when the selected equipment, project, or phase changes.
    useEffect(() => {
        const unit = item?.unit ?? EquipmentUnit.number;

        setLocalItem({
            ...(item ?? {}),
            project: project ?? item?.project ?? undefined,
            phase: phase ?? item?.phase ?? undefined,
            itemName: item?.itemName ?? '',
            description: item?.description ?? '',
            unit,
            packSize:
                unit === EquipmentUnit.number
                    ? 1
                    : item?.packSize ?? 1,
            quantity: item?.quantity ?? 1,
            unitPrice: item?.unitPrice ?? 0
        } as PhaseEquipment);

        setSubmitted(false);
    }, [item, project, phase]);

    // Load phases only when a project is known and no phase was passed.
    useEffect(() => {
        let cancelled = false;

        const fetchPhases = async () => {
            if (!projectId || phaseLocked) {
                setPhases([]);
                return;
            }

            setLoadingPhases(true);

            try {
                const data = await PhaseApi.lookup!({
                    project: projectId
                });

                if (!cancelled) {
                    setPhases(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Failed to load phases:', error);

                if (!cancelled) {
                    setPhases([]);
                }
            } finally {
                if (!cancelled) {
                    setLoadingPhases(false);
                }
            }
        };

        fetchPhases();

        return () => {
            cancelled = true;
        };
    }, [projectId, phaseLocked]);

    const unitOptions = Object.values(EquipmentUnit).map((unit) => ({
        label: unit.charAt(0).toUpperCase() + unit.slice(1),
        value: unit
    }));

    const projectMissing = !projectId;
    const itemNameMissing = !localItem.itemName?.trim();
    const descriptionMissing = !localItem.description?.trim();

    const unitMissing = !localItem.unit;

    const packSizeInvalid =
        localItem.unit !== EquipmentUnit.number &&
        (
            localItem.packSize == null ||
            !Number.isFinite(localItem.packSize) ||
            localItem.packSize <= 0
        );

    const quantityInvalid =
        localItem.quantity == null ||
        !Number.isFinite(localItem.quantity) ||
        localItem.quantity <= 0;

    const unitPriceInvalid =
        localItem.unitPrice == null ||
        !Number.isFinite(localItem.unitPrice) ||
        localItem.unitPrice < 0;

    const totalCost =
        (localItem.quantity ?? 0) * (localItem.unitPrice ?? 0);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            itemNameMissing ||
            descriptionMissing ||
            unitMissing ||
            packSizeInvalid ||
            quantityInvalid ||
            unitPriceInvalid
        ) {
            return;
        }

        const equipmentData = {
            ...localItem,
            project: localItem.project,
            phase: localItem.phase || undefined,
            packSize:
                localItem.unit === EquipmentUnit.number
                    ? 1
                    : localItem.packSize
        } as PhaseEquipment;

        // Reuse the existing model validation.
        const validation = validatePhaseEquipment(equipmentData);

        if (!validation.valid) {
            return;
        }

        await onSubmit(equipmentData);
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid"
            noValidate
        >
            <div className="grid">
                {/* Project: supplied by the parent */}
                <div className="field col-12 md:col-6">
                    <label className="font-bold text-sm block mb-2">
                        Project <span className="text-red-500">*</span>
                    </label>

                    <div
                        className={classNames(
                            'p-inputtext p-component flex align-items-center surface-100 text-color-secondary',
                            {
                                'p-invalid': submitted && projectMissing
                            }
                        )}
                    >
                        {typeof localItem.project === 'object' &&
                        localItem.project
                            ? localItem.project.title
                            : projectId
                            ? `Project ID: ${projectId}`
                            : 'No project selected'}
                    </div>

                    {submitted && projectMissing && (
                        <small className="p-error block mt-1">
                            A project is required.
                        </small>
                    )}
                </div>

                {/* Phase: Side-by-side with project, optional, independent */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="phase"
                        className="font-bold text-sm block mb-2"
                    >
                        Phase
                    </label>

                    {phaseLocked ? (
                        <div className="p-inputtext p-component flex align-items-center surface-100 text-color-secondary">
                            {typeof phase === 'object'
                                ? `Phase ${phase.order}`
                                : typeof item?.phase === 'object'
                                ? `Phase ${item.phase.order}`
                                : phaseId
                                ? `Selected phase`
                                : 'No phase selected'}
                        </div>
                    ) : (
                        <Dropdown
                            id="phase"
                            value={phaseId ?? null}
                            options={phases}
                            optionValue="_id"
                            optionLabel="order"
                            onChange={(e) => {
                                const selectedPhase =
                                    phases.find((p) => p._id === e.value) ?? null;

                                setLocalItem((prev) => ({
                                    ...prev,
                                    phase: selectedPhase ?? undefined
                                }));
                            }}
                            placeholder="No phase selected"
                            showClear
                            filter
                            disabled={saving || !projectId}
                            itemTemplate={(phase: Phase) => `Phase ${phase.order}`}
                        />
                    )}
                </div>

                {/* Equipment name */}
                <div className="field col-12">
                    <label
                        htmlFor="itemName"
                        className="font-bold text-sm block mb-2"
                    >
                        Equipment Name{' '}
                        <span className="text-red-500">*</span>
                    </label>

                    <InputText
                        id="itemName"
                        value={localItem.itemName}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                itemName: e.target.value
                            }))
                        }
                        placeholder="e.g., Laptop Computer"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && itemNameMissing
                        })}
                    />

                    {submitted && itemNameMissing && (
                        <small className="p-error block mt-1">
                            Equipment name is required.
                        </small>
                    )}
                </div>

                {/* Description */}
                <div className="field col-12">
                    <label
                        htmlFor="description"
                        className="font-bold text-sm block mb-2"
                    >
                        Description{' '}
                        <span className="text-red-500">*</span>
                    </label>

                    <InputTextarea
                        id="description"
                        value={localItem.description ?? ''}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                description: e.target.value
                            }))
                        }
                        rows={2}
                        autoResize
                        placeholder="Describe the equipment specifications..."
                        disabled={saving}
                        className={classNames({
                            'p-invalid':
                                submitted && descriptionMissing
                        })}
                    />

                    {submitted && descriptionMissing && (
                        <small className="p-error block mt-1">
                            Description is required.
                        </small>
                    )}
                </div>

                {/* Unit */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="unit"
                        className="font-bold text-sm block mb-2"
                    >
                        Unit <span className="text-red-500">*</span>
                    </label>

                    <Dropdown
                        id="unit"
                        value={localItem.unit}
                        options={unitOptions}
                        onChange={(e) => {
                            const selectedUnit = e.value as EquipmentUnit;

                            setLocalItem((prev) => ({
                                ...prev,
                                unit: selectedUnit,
                                packSize:
                                    selectedUnit === EquipmentUnit.number
                                        ? 1
                                        : prev.packSize ?? 1
                            }));
                        }}
                        placeholder="Select unit"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && unitMissing
                        })}
                    />

                    {submitted && unitMissing && (
                        <small className="p-error block mt-1">
                            Unit is required.
                        </small>
                    )}
                </div>

                {/* Pack size */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="packSize"
                        className="font-bold text-sm block mb-2"
                    >
                        Pack Size
                        {localItem.unit !== EquipmentUnit.number && (
                            <span className="text-red-500"> *</span>
                        )}
                    </label>

                    <InputNumber
                        id="packSize"
                        value={
                            localItem.unit === EquipmentUnit.number
                                ? 1
                                : localItem.packSize ?? 1
                        }
                        onValueChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                packSize: e.value ?? 1
                            }))
                        }
                        useGrouping={false}
                        min={0.0001}
                        maxFractionDigits={4}
                        disabled={
                            saving ||
                            localItem.unit === EquipmentUnit.number
                        }
                        placeholder="Enter pack size"
                        className={classNames({
                            'p-invalid':
                                submitted && packSizeInvalid
                        })}
                    />

                    {submitted && packSizeInvalid && (
                        <small className="p-error block mt-1">
                            Pack size must be greater than zero.
                        </small>
                    )}
                </div>

                {/* Quantity */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="quantity"
                        className="font-bold text-sm block mb-2"
                    >
                        Quantity <span className="text-red-500">*</span>
                    </label>

                    <InputNumber
                        id="quantity"
                        value={localItem.quantity ?? 1}
                        onValueChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                quantity: e.value ?? 1
                            }))
                        }
                        useGrouping={false}
                        min={0.0001}
                        maxFractionDigits={4}
                        placeholder="Enter quantity"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && quantityInvalid
                        })}
                    />

                    {submitted && quantityInvalid && (
                        <small className="p-error block mt-1">
                            Quantity must be greater than zero.
                        </small>
                    )}
                </div>

                {/* Unit price */}
                <div className="field col-12 md:col-6">
                    <label
                        htmlFor="unitPrice"
                        className="font-bold text-sm block mb-2"
                    >
                        Unit Price (ETB){' '}
                        <span className="text-red-500">*</span>
                    </label>

                    <InputNumber
                        id="unitPrice"
                        value={localItem.unitPrice ?? 0}
                        onValueChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                unitPrice: e.value ?? 0
                            }))
                        }
                        mode="currency"
                        currency="ETB"
                        locale="en-ET"
                        min={0}
                        placeholder="Enter unit price"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && unitPriceInvalid
                        })}
                    />

                    {submitted && unitPriceInvalid && (
                        <small className="p-error block mt-1">
                            Unit price cannot be negative.
                        </small>
                    )}
                </div>

                {/* Calculated total */}
                <div className="field col-12">
                    <label className="font-bold text-sm block mb-2">
                        Total Cost
                    </label>

                    <div className="p-3 border-round surface-100 flex align-items-center justify-content-between">
                        <span className="text-sm text-color-secondary">
                            {localItem.quantity ?? 0} ×{' '}
                            {etbCurrencyFormatter.format(
                                localItem.unitPrice ?? 0
                            )}
                        </span>

                        <span className="text-lg font-bold text-primary">
                            {etbCurrencyFormatter.format(totalCost)}
                        </span>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default EquipmentForm;