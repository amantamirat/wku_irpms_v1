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

import {
    FieldError,
    FieldHint,
    FieldLabel,
    LockedField,
    SectionCard,
    StatCard
} from '@/templates/FormPrimitives';
import { etbCurrencyFormatter, extractId, getReferenceName } from '@/utils/utils';

interface EquipmentFormProps extends ItemFormRenderProps<PhaseEquipment> {
    project?: Project | string | null;
    phase?: Phase | string | null;
}

const phaseLabelOf = (p?: Phase | null) => (p ? `Phase ${p.order}` : '');

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

        void fetchPhases();

        return () => {
            cancelled = true;
        };
    }, [projectId, phaseLocked]);

    const unitOptions = Object.values(EquipmentUnit).map((unit) => ({
        label: unit.charAt(0).toUpperCase() + unit.slice(1),
        value: unit
    }));

    const resolvedPhase: Phase | null = phases.find((p) => p._id === phaseId) ?? 
        (typeof localItem.phase === 'object' ? (localItem.phase as Phase) : null);

    const projectMissing = !projectId;
    const phaseMissing = !phaseId;
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

    const projectLabel = getReferenceName(
        localItem.project,
        'title',
        projectId ? `Project ID: ${projectId}` : 'No project selected'
    );

    const lockedPhaseLabel =
        phaseLabelOf(resolvedPhase) || (phaseId ? 'Selected phase' : 'No phase selected');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            phaseMissing ||
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
            phase: localItem.phase,
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
            className="p-fluid flex flex-column gap-4"
            noValidate
        >
            {/* 1. Project & phase */}
            <SectionCard
                step={1}
                icon="pi-sitemap"
                title="Project & Phase"
                description="The equipment item must be assigned to a specific project and phase."
            >
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="equipment-project" required>
                            Project
                        </FieldLabel>
                        <LockedField id="equipment-project" value={projectLabel} />
                        <FieldError show={submitted && projectMissing}>
                            A project is required.
                        </FieldError>
                    </div>

                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="equipment-phase" required>
                            Phase
                        </FieldLabel>

                        {phaseLocked ? (
                            <LockedField id="equipment-phase" value={lockedPhaseLabel} />
                        ) : (
                            <Dropdown
                                inputId="equipment-phase"
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
                                placeholder={loadingPhases ? 'Loading phases...' : 'Select the phase'}
                                emptyMessage="No phases found for this project"
                                valueTemplate={(p: Phase | null, props) =>
                                    p ? `Phase ${p.order}` : props?.placeholder
                                }
                                itemTemplate={(p: Phase) => `Phase ${p.order}`}
                                disabled={saving || !projectId || loadingPhases}
                                className={classNames({ 'p-invalid': submitted && phaseMissing })}
                            />
                        )}

                        <FieldError show={submitted && phaseMissing}>A phase is required.</FieldError>
                    </div>
                </div>
            </SectionCard>

            {/* 2. Equipment Specifications */}
            <SectionCard
                step={2}
                icon="pi-box"
                title="Equipment Specifications"
                description="Name, description, and measurement units for the equipment."
            >
                <div className="formgrid grid">
                    <div className="field col-12">
                        <FieldLabel htmlFor="itemName" required>
                            Equipment Name
                        </FieldLabel>
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
                        <FieldError show={submitted && itemNameMissing}>
                            Equipment name is required.
                        </FieldError>
                    </div>

                    <div className="field col-12 mb-0">
                        <FieldLabel htmlFor="description" required>
                            Description
                        </FieldLabel>
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
                                'p-invalid': submitted && descriptionMissing
                            })}
                        />
                        <FieldError show={submitted && descriptionMissing}>
                            Description is required.
                        </FieldError>
                    </div>
                </div>
            </SectionCard>

            {/* 3. Quantity & Pricing */}
            <SectionCard
                step={3}
                icon="pi-wallet"
                title="Quantity & Pricing"
                description="Specify units, packaging sizes, quantities, and unit costs."
            >
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <FieldLabel htmlFor="unit" required>
                            Unit
                        </FieldLabel>
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
                        <FieldError show={submitted && unitMissing}>
                            Unit is required.
                        </FieldError>
                    </div>

                    <div className="field col-12 md:col-6">
                        <FieldLabel htmlFor="packSize">
                            Pack Size
                            {localItem.unit !== EquipmentUnit.number && (
                                <span className="text-red-500"> *</span>
                            )}
                        </FieldLabel>
                        <InputNumber
                            inputId="packSize"
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
                                'p-invalid': submitted && packSizeInvalid
                            })}
                        />
                        <FieldError show={submitted && packSizeInvalid}>
                            Pack size must be greater than zero.
                        </FieldError>
                    </div>

                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="quantity" required>
                            Quantity
                        </FieldLabel>
                        <InputNumber
                            inputId="quantity"
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
                        <FieldError show={submitted && quantityInvalid}>
                            Quantity must be greater than zero.
                        </FieldError>
                    </div>

                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="unitPrice" required>
                            Unit Price (ETB)
                        </FieldLabel>
                        <InputNumber
                            inputId="unitPrice"
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
                        <FieldError show={submitted && unitPriceInvalid}>
                            Unit price cannot be negative.
                        </FieldError>
                    </div>

                    <div className="col-12 pt-3">
                        <StatCard icon="pi-money-bill" label="Total Cost (ETB)" color="green">
                            <div className="flex align-items-center justify-content-between w-full">
                                <span className="text-xs text-500 font-semibold">
                                    {localItem.quantity ?? 0} units × {etbCurrencyFormatter.format(localItem.unitPrice ?? 0)}
                                </span>
                                <span className="text-lg font-bold text-green-700 font-mono">
                                    {etbCurrencyFormatter.format(totalCost)}
                                </span>
                            </div>
                        </StatCard>
                    </div>
                </div>
            </SectionCard>
        </form>
    );
};

export default EquipmentForm;