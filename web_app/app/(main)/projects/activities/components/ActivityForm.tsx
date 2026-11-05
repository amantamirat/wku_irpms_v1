'use client';

import { Calendar } from 'primereact/calendar';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { classNames } from 'primereact/utils';
import { FormEvent, useEffect, useState } from 'react';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Project } from '@/app/(main)/projects/models/project.model';
import { Activity, PhaseActivityType, PhaseActivityTypeLabels } from '../models/phase-activity.model';
import { etbCurrencyFormatter, extractId } from '@/utils/utils';

import { Phase } from '../../phases/models/phase.model';
import { PhaseApi } from '../../phases/api/phase.api';

// Sub-detail forms
import { DataCollectionDetailForm } from './activity-details/DataCollectionDetailForm';
import { TrainingWorkshopDetailForm } from './activity-details/TrainingWorkshopDetailForm';
import { MeetingDetailForm } from './activity-details/MeetingDetailForm';
import { TransportationDetailForm } from './activity-details/TransportationDetailForm';
import { AnalysisDetailForm } from './activity-details/AnalysisDetailForm';
import { FieldVisitDetailForm } from './activity-details/FieldVisitDetailForm';
import { DisseminationDetailForm } from './activity-details/DisseminationDetailForm';
import { DevelopmentDetailForm } from './activity-details/DevelopmentDetailForm';
import { OtherDetailForm } from './activity-details/OtherDetailForm';
import { optionTemplate } from '../../phases/documents/components/PhaseDocumentForm';
import { ActivityDetailFields } from './ActivityDetailFields';

interface ActivityFormProps extends ItemFormRenderProps<Activity> {
    project?: Project | string | null;
    phase?: Phase | string | null;
}

const getDate = (value: Date | string | null | undefined) => {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};



const ActivityForm = ({
    item,
    saving,
    formId,
    onSubmit,
    project,
    phase
}: ActivityFormProps) => {

    const [localItem, setLocalItem] = useState<Activity>({
        ...(item ?? {}),
        project: project ?? item?.project ?? undefined,
        phase: phase ?? item?.phase ?? undefined,
        title: item?.title ?? '',
        description: item?.description ?? '',
        cost: item?.cost ?? 0,
        detailCost: item?.detailCost ? { ...item.detailCost } : undefined,
        startDate: getDate(item?.startDate),
        endDate: getDate(item?.endDate),
        kind: item?.kind ?? PhaseActivityType.DATA_COLLECTION,
        details: item?.details ?? {}
    } as Activity);

    const [phases, setPhases] = useState<Phase[]>([]);
    const [loadingPhases, setLoadingPhases] = useState(false);
    const [hasDetailCost, setHasDetailCost] = useState(!!item?.detailCost);
    const [submitted, setSubmitted] = useState(false);

    const projectId = extractId(localItem.project);
    const phaseId = extractId(localItem.phase);
    const phaseLocked = phase != null;

    useEffect(() => {
        setLocalItem({
            ...(item ?? {}),
            project: project ?? item?.project ?? undefined,
            phase: phase ?? item?.phase ?? undefined,
            title: item?.title ?? '',
            description: item?.description ?? '',
            cost: item?.cost ?? 0,
            detailCost: item?.detailCost ? { ...item.detailCost } : undefined,
            startDate: getDate(item?.startDate),
            endDate: getDate(item?.endDate),
            kind: item?.kind ?? PhaseActivityType.DATA_COLLECTION,
            details: item?.details ?? {}
        } as Activity);

        setHasDetailCost(!!item?.detailCost);
        setSubmitted(false);
    }, [item, project, phase]);

    useEffect(() => {
        let cancelled = false;
        const fetchPhases = async () => {
            if (!projectId || phaseLocked) {
                setPhases([]);
                return;
            }
            setLoadingPhases(true);
            try {
                const data = await PhaseApi.lookup!({ project: projectId });
                if (!cancelled) {
                    setPhases(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error('Failed to load phases:', error);
                if (!cancelled) setPhases([]);
            } finally {
                if (!cancelled) setLoadingPhases(false);
            }
        };

        fetchPhases();
        return () => {
            cancelled = true;
        };
    }, [projectId, phaseLocked]);

    const projectMissing = !projectId;
    const titleMissing = !localItem.title?.trim();
    const kindMissing = !localItem.kind;
    const costInvalid =
        localItem.cost == null ||
        !Number.isFinite(localItem.cost) ||
        localItem.cost < 0;

    const startDateMissing = !localItem.startDate;
    const endDateMissing = !localItem.endDate;

    const dateRangeInvalid =
        !startDateMissing &&
        !endDateMissing &&
        new Date(localItem.endDate!).getTime() < new Date(localItem.startDate!).getTime();

    const handleKindChange = (newKind: PhaseActivityType) => {
        setLocalItem((prev) => ({
            ...prev,
            kind: newKind,
            details: {}
        } as Activity));
    };

    const handleToggleDetailCost = (checked: boolean) => {
        setHasDetailCost(checked);
        if (checked) {
            setLocalItem((prev) => ({
                ...prev,
                detailCost: { duration: 1, participants: 1, unitPrice: 0 },
                cost: 0
            }));
        } else {
            setLocalItem((prev) => {
                const { detailCost, ...rest } = prev;
                return rest as Activity;
            });
        }
    };

    const handleDetailCostChange = (
        field: 'duration' | 'participants' | 'unitPrice',
        value: number
    ) => {
        if (!localItem.detailCost) return;
        const detailCost = { ...localItem.detailCost, [field]: value };
        const calculatedCost =
            (detailCost.duration ?? 1) *
            (detailCost.participants ?? 1) *
            (detailCost.unitPrice ?? 0);

        setLocalItem((prev) => ({
            ...prev,
            detailCost,
            cost: calculatedCost
        }));
    };

    /*
    const renderActivitySpecificForm = () => {
        switch (localItem.kind) {
            case PhaseActivityType.DATA_COLLECTION:
                return (
                    <DataCollectionDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.TRAINING_WORKSHOP:
                return (
                    <TrainingWorkshopDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.MEETING:
                return (
                    <MeetingDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.TRANSPORTATION:
                return (
                    <TransportationDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.ANALYSIS:
                return (
                    <AnalysisDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.FIELD_VISIT:
                return (
                    <FieldVisitDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.DISSEMINATION:
                return (
                    <DisseminationDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.DESIGN:
                return (
                    <DevelopmentDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            case PhaseActivityType.OTHER:
                return (
                    <OtherDetailForm
                        details={(localItem as any).details || {}}
                        onChange={(details) => setLocalItem((prev) => ({ ...prev, details } as Activity))}
                        disabled={saving}
                    />
                );
            default:
                return null;
        }
    };
    */

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            titleMissing ||
            kindMissing ||
            costInvalid ||
            startDateMissing ||
            endDateMissing ||
            dateRangeInvalid
        ) {
            return;
        }

        const { status, statusHistory, ...activityData } = localItem as Activity & {
            status?: unknown;
            statusHistory?: unknown;
        };

        await onSubmit({
            ...activityData,
            project: localItem.project,
            phase: localItem.phase || undefined,
            startDate: new Date(localItem.startDate!),
            endDate: new Date(localItem.endDate!)
        } as Activity);
    };

    const activityTypeOptions = Object.values(PhaseActivityType).map((type) => ({
        label: PhaseActivityTypeLabels[type].label,
        value: type,
        description: PhaseActivityTypeLabels[type].description
    }));


    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <div className="grid">
                {/* Project - Single line with text truncation */}
                <div className="field col-12 md:col-6">
                    <label className="font-bold text-sm block mb-2">
                        Project <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={classNames(
                            'p-inputtext p-component flex align-items-center surface-100 text-color-secondary white-space-nowrap overflow-hidden text-overflow-ellipsis',
                            { 'p-invalid': submitted && projectMissing }
                        )}
                        title={
                            typeof localItem.project === 'object' && localItem.project
                                ? localItem.project.title
                                : projectId
                                    ? `Project ID: ${projectId}`
                                    : 'No project selected'
                        }
                    >
                        {typeof localItem.project === 'object' && localItem.project
                            ? localItem.project.title
                            : projectId
                                ? `Project ID: ${projectId}`
                                : 'No project selected'}
                    </div>
                    {submitted && projectMissing && (
                        <small className="p-error block mt-1">A project is required.</small>
                    )}
                </div>

                {/* Phase */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="phase" className="font-bold text-sm block mb-2">
                        Phase
                    </label>
                    {phaseLocked ? (
                        <div className="p-inputtext p-component flex align-items-center surface-100 text-color-secondary white-space-nowrap overflow-hidden text-overflow-ellipsis">
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
                                const selectedPhase = phases.find((p) => p._id === e.value) ?? null;
                                setLocalItem((prev) => ({
                                    ...prev,
                                    phase: selectedPhase ?? undefined
                                }));
                            }}
                            placeholder="Select the Phase"
                            showClear
                            disabled={saving || !projectId}
                            itemTemplate={(phase: Phase) => `Phase ${phase.order}`}
                        />
                    )}
                </div>

                {/* Activity Short Title */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="title" className="font-bold text-sm block mb-2">
                        Activity Short Title <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="title"
                        value={localItem.title}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                title: e.target.value
                            }))
                        }
                        placeholder="e.g., Requirements Gathering & Analysis"
                        disabled={saving}
                        className={classNames({ 'p-invalid': submitted && titleMissing })}
                    />
                    {submitted && titleMissing && (
                        <small className="p-error block mt-1">Activity title is required.</small>
                    )}
                </div>

                {/* Activity Type (Kind) - Side-by-side with Title */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="kind" className="font-bold text-sm block mb-2">
                        Activity Type (Kind) <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        id="kind"
                        value={localItem.kind}
                        options={activityTypeOptions}
                        optionLabel="label"
                        optionValue="value"
                        itemTemplate={optionTemplate}
                        valueTemplate={(option) =>
                            option ? option.label : 'Select activity kind'
                        }
                        onChange={(e) => handleKindChange(e.value)}
                        placeholder="Select Activity Type"
                        disabled={saving}
                        className={classNames({ 'p-invalid': submitted && kindMissing })}
                        panelStyle={{ maxWidth: '450px', width: 'auto' }}
                    />
                    {submitted && kindMissing && (
                        <small className="p-error block mt-1">Activity type is required.</small>
                    )}
                </div>

                {/* Description - Full width multi-line textarea */}
                <div className="field col-12">
                    <label htmlFor="description" className="font-bold text-sm block mb-2">
                        Description
                    </label>
                    <InputTextarea
                        id="description"
                        rows={2}
                        autoResize
                        value={localItem.description || ''}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                description: e.target.value
                            }))
                        }
                        placeholder="Detailed outline of tasks involved..."
                        disabled={saving}
                    />
                </div>

                {/* Dynamic Sub-Details Form Section */}
                <div className="col-12 surface-ground p-3 border-round my-2">
                    <ActivityDetailFields
                        kind={localItem.kind}
                        details={(localItem as any).details}
                        onChange={(details) =>
                            setLocalItem((prev) => ({ ...prev, details } as Activity))
                        }
                        disabled={saving}
                    />
                </div>

                {/* Cost breakdown */}
                <div className="field col-12">
                    <div className="flex align-items-center justify-content-between mb-2">
                        <label className="font-bold text-sm">
                            Cost (ETB) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex align-items-center gap-2">
                            <Checkbox
                                inputId="enableDetailCost"
                                checked={hasDetailCost}
                                onChange={(e) => handleToggleDetailCost(e.checked ?? false)}
                                disabled={saving}
                            />
                            <label
                                htmlFor="enableDetailCost"
                                className="cursor-pointer text-sm font-semibold select-none"
                            >
                                Breakdown Calculation
                            </label>
                        </div>
                    </div>

                    {hasDetailCost && localItem.detailCost ? (
                        <div className="grid">
                            <div className="field col-12 md:col-4 mb-2">
                                <label htmlFor="detailDuration" className="text-xs font-semibold block mb-1">
                                    Duration (Days)
                                </label>
                                <InputNumber
                                    id="detailDuration"
                                    value={localItem.detailCost.duration}
                                    onValueChange={(e) => handleDetailCostChange('duration', e.value ?? 1)}
                                    useGrouping={false}
                                    min={1}
                                    disabled={saving}
                                />
                            </div>

                            <div className="field col-12 md:col-4 mb-2">
                                <label htmlFor="participants" className="text-xs font-semibold block mb-1">
                                    Participants
                                </label>
                                <InputNumber
                                    id="participants"
                                    value={localItem.detailCost.participants}
                                    onValueChange={(e) => handleDetailCostChange('participants', e.value ?? 1)}
                                    useGrouping={false}
                                    min={1}
                                    disabled={saving}
                                />
                            </div>

                            <div className="field col-12 md:col-4 mb-2">
                                <label htmlFor="unitPrice" className="text-xs font-semibold block mb-1">
                                    Unit Price (ETB)
                                </label>
                                <InputNumber
                                    id="unitPrice"
                                    value={localItem.detailCost.unitPrice}
                                    onValueChange={(e) => handleDetailCostChange('unitPrice', e.value ?? 0)}
                                    mode="currency"
                                    currency="ETB"
                                    locale="en-ET"
                                    min={0}
                                    disabled={saving}
                                />
                            </div>

                            <div className="col-12 flex align-items-center justify-content-between pt-2">
                                <span className="text-xs text-500 font-semibold">
                                    Total: ({localItem.detailCost.duration} days × {localItem.detailCost.participants} participants × {etbCurrencyFormatter.format(localItem.detailCost.unitPrice)})
                                </span>
                                <span className="text-lg font-bold text-green-700 font-mono">
                                    {etbCurrencyFormatter.format(localItem.cost ?? 0)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <InputNumber
                            id="cost"
                            value={localItem.cost}
                            onValueChange={(e) =>
                                setLocalItem((prev) => ({
                                    ...prev,
                                    cost: e.value ?? 0
                                }))
                            }
                            min={0}
                            mode="currency"
                            currency="ETB"
                            locale="en-ET"
                            placeholder="Enter total cost"
                            disabled={saving}
                            className={classNames({ 'p-invalid': submitted && costInvalid })}
                        />
                    )}

                    {submitted && costInvalid && (
                        <small className="p-error block mt-1">Cost must be zero or greater.</small>
                    )}
                </div>

                {/* Start date */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="startDate" className="font-bold text-sm block mb-2">
                        Start Date <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="startDate"
                        value={localItem.startDate ?? null}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                startDate: e.value ?? undefined
                            }))
                        }
                        dateFormat="yy-mm-dd"
                        showIcon
                        placeholder="Select start date"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && (startDateMissing || dateRangeInvalid)
                        })}
                    />
                    {submitted && startDateMissing && (
                        <small className="p-error block mt-1">Start date is required.</small>
                    )}
                </div>

                {/* End date */}
                <div className="field col-12 md:col-6">
                    <label htmlFor="endDate" className="font-bold text-sm block mb-2">
                        End Date <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="endDate"
                        value={localItem.endDate ?? null}
                        onChange={(e) =>
                            setLocalItem((prev) => ({
                                ...prev,
                                endDate: e.value ?? undefined
                            }))
                        }
                        dateFormat="yy-mm-dd"
                        showIcon
                        minDate={localItem.startDate ? new Date(localItem.startDate) : undefined}
                        placeholder="Select end date"
                        disabled={saving}
                        className={classNames({
                            'p-invalid': submitted && (endDateMissing || dateRangeInvalid)
                        })}
                    />
                    {submitted && endDateMissing && (
                        <small className="p-error block mt-1">End date is required.</small>
                    )}
                    {submitted && !endDateMissing && dateRangeInvalid && (
                        <small className="p-error block mt-1">
                            End date cannot be before the start date.
                        </small>
                    )}
                </div>
            </div>
        </form>
    );
};

export default ActivityForm;