'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { Project } from '@/app/(main)/projects/models/project.model';
import {
    Activity,
    PhaseActivityType,
    PhaseActivityTypeLabels
} from '../models/phase-activity.model';

import { Phase } from '../../phases/models/phase.model';
import { PhaseApi } from '../../phases/api/phase.api';
import { optionTemplate } from '../../phases/documents/components/PhaseDocumentForm';
import { ActivityDetailFields } from './ActivityDetailFields';

import {
    FieldError,
    FieldHint,
    FieldLabel,
    LockedField,
    SectionCard,
    StatCard
} from '@/templates/FormPrimitives';
import { etbCurrencyFormatter, extractId, getReferenceName } from '@/utils/utils';

interface ActivityFormProps extends ItemFormRenderProps<Activity> {
    project?: Project | string | null;
    phase?: Phase | string | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const getDate = (value: Date | string | null | undefined) => {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

/** Normalise to local midnight so comparisons are day-based, not time-based. */
const startOfDay = (value: Date | string | null | undefined) => {
    const date = getDate(value);
    if (!date) return undefined;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatDate = (value: Date | undefined) =>
    value
        ? value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

const phaseLabelOf = (p?: Phase | null) => (p ? `Phase ${p.order}` : '');

const createInitialActivity = (
    item: Partial<Activity> | null | undefined,
    project?: Project | string | null,
    phase?: Phase | string | null
): Activity =>
    ({
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
    }) as Activity;

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

const ActivityForm = ({
    item,
    saving,
    formId,
    onSubmit,
    project,
    phase
}: ActivityFormProps) => {
    const [localItem, setLocalItem] = useState<Activity>(() =>
        createInitialActivity(item, project, phase)
    );

    const [phases, setPhases] = useState<Phase[]>([]);
    const [fetchedPhase, setFetchedPhase] = useState<Phase | null>(null);
    const [loadingPhases, setLoadingPhases] = useState(false);
    const [hasDetailCost, setHasDetailCost] = useState(!!item?.detailCost);
    const [submitted, setSubmitted] = useState(false);

    const isEdit = Boolean(item?._id);
    const projectId = extractId(localItem.project);
    const phaseId = extractId(localItem.phase);
    const phaseLocked = phase != null;

    useEffect(() => {
        setLocalItem(createInitialActivity(item, project, phase));
        setHasDetailCost(!!item?.detailCost);
        setSubmitted(false);
    }, [item, project, phase]);

    /* ----------------------------- phases --------------------------- */
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
                if (!cancelled) setPhases(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to load phases:', error);
                if (!cancelled) setPhases([]);
            } finally {
                if (!cancelled) setLoadingPhases(false);
            }
        };

        void fetchPhases();
        return () => {
            cancelled = true;
        };
    }, [projectId, phaseLocked]);

    /**
     * The phase that bounds the activity dates. It may be a populated object,
     * an entry of the lookup list, or (when only an id was passed) fetched by id.
     */
    const resolvedPhase: Phase | null = useMemo(() => {
        if (localItem.phase && typeof localItem.phase === 'object') {
            return localItem.phase as Phase;
        }
        if (!phaseId) return null;
        return phases.find((p) => p._id === phaseId) ?? (fetchedPhase?._id === phaseId ? fetchedPhase : null);
    }, [localItem.phase, phaseId, phases, fetchedPhase]);

    useEffect(() => {
        let cancelled = false;

        const loadPhase = async () => {
            if (!phaseId || resolvedPhase || !PhaseApi.getById) return;
            try {
                const data = await PhaseApi.getById(phaseId);
                if (!cancelled) setFetchedPhase(data ?? null);
            } catch (error) {
                console.error('Failed to load phase:', error);
            }
        };

        void loadPhase();
        return () => {
            cancelled = true;
        };
    }, [phaseId, resolvedPhase]);

    /* --------------------------- validation ------------------------- */
    const phaseStart = startOfDay((resolvedPhase as any)?.startDate);
    const phaseEnd = startOfDay((resolvedPhase as any)?.endDate);

    const activityStart = startOfDay(localItem.startDate);
    const activityEnd = startOfDay(localItem.endDate);

    const projectMissing = !projectId;
    const phaseMissing = !phaseId;
    const titleMissing = !localItem.title?.trim();
    const kindMissing = !localItem.kind;
    const costInvalid =
        localItem.cost == null || !Number.isFinite(localItem.cost) || localItem.cost < 0;

    const startDateMissing = !activityStart;
    const endDateMissing = !activityEnd;

    const dateRangeInvalid =
        !!activityStart && !!activityEnd && activityEnd.getTime() < activityStart.getTime();

    const startBeforePhase =
        !!activityStart && !!phaseStart && activityStart.getTime() < phaseStart.getTime();
    const startAfterPhase =
        !!activityStart && !!phaseEnd && activityStart.getTime() > phaseEnd.getTime();
    const endBeforePhase =
        !!activityEnd && !!phaseStart && activityEnd.getTime() < phaseStart.getTime();
    const endAfterPhase =
        !!activityEnd && !!phaseEnd && activityEnd.getTime() > phaseEnd.getTime();

    const startOutOfPhase = startBeforePhase || startAfterPhase;
    const endOutOfPhase = endBeforePhase || endAfterPhase;

    const startInvalid = startDateMissing || startOutOfPhase || dateRangeInvalid;
    const endInvalid = endDateMissing || endOutOfPhase || dateRangeInvalid;

    const phaseRangeText =
        phaseStart && phaseEnd
            ? `${formatDate(phaseStart)} – ${formatDate(phaseEnd)}`
            : null;

    const datesDisabled = saving || phaseMissing;

    /* ------------------------ progress indicator -------------------- */
    const requiredChecks = [
        { label: 'Phase', done: !phaseMissing },
        { label: 'Title', done: !titleMissing },
        { label: 'Type', done: !kindMissing },
        { label: 'Cost', done: !costInvalid },
        { label: 'Start date', done: !startDateMissing && !startOutOfPhase },
        { label: 'End date', done: !endDateMissing && !endOutOfPhase && !dateRangeInvalid }
    ];
    const completed = requiredChecks.filter((c) => c.done).length;
    const percent = Math.round((completed / requiredChecks.length) * 100);

    /* ----------------------------- handlers ------------------------- */
    const handlePhaseChange = (selected: Phase | null) => {
        setLocalItem((prev) => {
            const next = { ...prev, phase: selected ?? undefined } as Activity;

            // Drop dates that no longer fit inside the newly selected phase
            const nextStart = startOfDay((selected as any)?.startDate);
            const nextEnd = startOfDay((selected as any)?.endDate);

            const outside = (value: Date | string | null | undefined) => {
                const d = startOfDay(value);
                if (!d) return false;
                if (!selected) return true;
                return (
                    (!!nextStart && d.getTime() < nextStart.getTime()) ||
                    (!!nextEnd && d.getTime() > nextEnd.getTime())
                );
            };

            if (outside(prev.startDate)) next.startDate = undefined;
            if (outside(prev.endDate)) next.endDate = undefined;
            return next;
        });
    };

    const handleKindChange = (newKind: PhaseActivityType) => {
        setLocalItem((prev) => ({ ...prev, kind: newKind, details: {} }) as Activity);
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

        setLocalItem((prev) => ({ ...prev, detailCost, cost: calculatedCost }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (
            saving ||
            projectMissing ||
            phaseMissing ||
            titleMissing ||
            kindMissing ||
            costInvalid ||
            startInvalid ||
            endInvalid
        ) {
            return;
        }

        const { status, statusHistory, ...activityData } = localItem as Activity & {
            status?: unknown;
            statusHistory?: unknown;
        };

        await onSubmit({
            ...activityData,
            title: localItem.title.trim(),
            project: localItem.project,
            phase: localItem.phase,
            startDate: new Date(localItem.startDate!),
            endDate: new Date(localItem.endDate!)
        } as Activity);
    };

    const activityTypeOptions = Object.values(PhaseActivityType).map((type) => ({
        label: PhaseActivityTypeLabels[type].label,
        value: type,
        description: PhaseActivityTypeLabels[type].description
    }));

    const projectLabel = getReferenceName(
        localItem.project,
        'title',
        projectId ? `Project ID: ${projectId}` : 'No project selected'
    );

    const lockedPhaseLabel =
        phaseLabelOf(resolvedPhase) || (phaseId ? 'Selected phase' : 'No phase selected');

    /* ------------------------------ render -------------------------- */
    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className="p-fluid flex flex-column gap-4"
            noValidate
        >
            {/* Progress header */}
            <div className="surface-card border-1 surface-border border-round-xl shadow-1 p-4">
                <div className="flex align-items-center justify-content-between mb-3">
                    <div>
                        <div className="font-semibold text-900">
                            {isEdit ? 'Edit activity' : 'New activity'}
                        </div>
                        <small className="text-500">
                            {completed === requiredChecks.length
                                ? 'All required information is filled in.'
                                : `${requiredChecks.length - completed} required field${
                                      requiredChecks.length - completed > 1 ? 's' : ''
                                  } left`}
                        </small>
                    </div>
                    <Tag
                        value={`${percent}%`}
                        severity={percent === 100 ? 'success' : 'info'}
                        rounded
                    />
                </div>

                <ProgressBar value={percent} showValue={false} style={{ height: '6px' }} />

                <div className="flex flex-wrap gap-2 mt-3">
                    {requiredChecks.map((check) => (
                        <span
                            key={check.label}
                            className={classNames(
                                'inline-flex align-items-center gap-1 px-2 py-1 border-round-2xl text-xs font-medium',
                                check.done ? 'bg-green-50 text-green-700' : 'surface-100 text-500'
                            )}
                        >
                            <i
                                className={classNames(
                                    'pi text-xs',
                                    check.done ? 'pi-check-circle' : 'pi-circle'
                                )}
                            />
                            {check.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* 1. Project & phase */}
            <SectionCard
                step={1}
                icon="pi-sitemap"
                title="Project & Phase"
                description="The activity belongs to a phase, and its dates must fall within that phase."
            >
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="activity-project" required>
                            Project
                        </FieldLabel>
                        <LockedField id="activity-project" value={projectLabel} />
                        <FieldError show={submitted && projectMissing}>
                            A project is required.
                        </FieldError>
                    </div>

                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="activity-phase" required>
                            Phase
                        </FieldLabel>

                        {phaseLocked ? (
                            <LockedField id="activity-phase" value={lockedPhaseLabel} />
                        ) : (
                            <Dropdown
                                inputId="activity-phase"
                                value={phaseId ?? null}
                                options={phases}
                                optionValue="_id"
                                optionLabel="order"
                                onChange={(e) =>
                                    handlePhaseChange(phases.find((p) => p._id === e.value) ?? null)
                                }
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

                        {phaseRangeText && (
                            <FieldHint>Phase runs {phaseRangeText}.</FieldHint>
                        )}
                    </div>
                </div>
            </SectionCard>

            {/* 2. Activity details */}
            <SectionCard
                step={2}
                icon="pi-file-edit"
                title="Activity Details"
                description="Title, type, and a description of the work involved."
            >
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6">
                        <FieldLabel htmlFor="title" required>
                            Activity Short Title
                        </FieldLabel>
                        <InputText
                            id="title"
                            value={localItem.title}
                            onChange={(e) =>
                                setLocalItem((prev) => ({ ...prev, title: e.target.value }))
                            }
                            placeholder="e.g., Requirements Gathering & Analysis"
                            disabled={saving}
                            className={classNames({ 'p-invalid': submitted && titleMissing })}
                        />
                        <FieldError show={submitted && titleMissing}>
                            Activity title is required.
                        </FieldError>
                    </div>

                    <div className="field col-12 md:col-6">
                        <FieldLabel htmlFor="kind" required>
                            Activity Type
                        </FieldLabel>
                        <Dropdown
                            inputId="kind"
                            value={localItem.kind}
                            options={activityTypeOptions}
                            optionLabel="label"
                            optionValue="value"
                            itemTemplate={optionTemplate}
                            valueTemplate={(option) =>
                                option ? option.label : 'Select activity type'
                            }
                            onChange={(e) => handleKindChange(e.value)}
                            placeholder="Select activity type"
                            disabled={saving}
                            className={classNames({ 'p-invalid': submitted && kindMissing })}
                            panelStyle={{ maxWidth: '450px', width: 'auto' }}
                        />
                        <FieldError show={submitted && kindMissing}>
                            Activity type is required.
                        </FieldError>
                    </div>

                    <div className="field col-12 mb-0">
                        <FieldLabel htmlFor="description">Description</FieldLabel>
                        <InputTextarea
                            id="description"
                            rows={2}
                            autoResize
                            value={localItem.description || ''}
                            onChange={(e) =>
                                setLocalItem((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Detailed outline of tasks involved..."
                            disabled={saving}
                        />
                    </div>
                </div>

                {/* Dynamic type-specific details */}
                <div className="surface-ground p-3 border-round mt-3">
                    <ActivityDetailFields
                        kind={localItem.kind}
                        details={(localItem as any).details}
                        onChange={(details) =>
                            setLocalItem((prev) => ({ ...prev, details }) as Activity)
                        }
                        disabled={saving}
                    />
                </div>
            </SectionCard>

            {/* 3. Cost */}
            <SectionCard
                step={3}
                icon="pi-wallet"
                title="Cost"
                description="Enter a total cost, or calculate it from duration, participants and unit price."
            >
                <div className="flex align-items-center justify-content-end gap-2 mb-3">
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
                        Breakdown calculation
                    </label>
                </div>

                {hasDetailCost && localItem.detailCost ? (
                    <div className="grid">
                        <div className="field col-12 md:col-4 mb-2">
                            <FieldLabel htmlFor="detailDuration">Duration (Days)</FieldLabel>
                            <InputNumber
                                inputId="detailDuration"
                                value={localItem.detailCost.duration}
                                onValueChange={(e) =>
                                    handleDetailCostChange('duration', e.value ?? 1)
                                }
                                useGrouping={false}
                                min={1}
                                disabled={saving}
                            />
                        </div>

                        <div className="field col-12 md:col-4 mb-2">
                            <FieldLabel htmlFor="participants">Participants</FieldLabel>
                            <InputNumber
                                inputId="participants"
                                value={localItem.detailCost.participants}
                                onValueChange={(e) =>
                                    handleDetailCostChange('participants', e.value ?? 1)
                                }
                                useGrouping={false}
                                min={1}
                                disabled={saving}
                            />
                        </div>

                        <div className="field col-12 md:col-4 mb-2">
                            <FieldLabel htmlFor="unitPrice">Unit Price (ETB)</FieldLabel>
                            <InputNumber
                                inputId="unitPrice"
                                value={localItem.detailCost.unitPrice}
                                onValueChange={(e) =>
                                    handleDetailCostChange('unitPrice', e.value ?? 0)
                                }
                                mode="currency"
                                currency="ETB"
                                locale="en-ET"
                                min={0}
                                disabled={saving}
                            />
                        </div>

                        <div className="col-12 flex align-items-center justify-content-between pt-2">
                            <span className="text-xs text-500 font-semibold">
                                Total: ({localItem.detailCost.duration} days ×{' '}
                                {localItem.detailCost.participants} participants ×{' '}
                                {etbCurrencyFormatter.format(localItem.detailCost.unitPrice)})
                            </span>
                            <span className="text-lg font-bold text-green-700 font-mono">
                                {etbCurrencyFormatter.format(localItem.cost ?? 0)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <StatCard icon="pi-money-bill" label="Total Cost (ETB)" color="green" required>
                        <InputNumber
                            inputId="cost"
                            value={localItem.cost}
                            onValueChange={(e) =>
                                setLocalItem((prev) => ({ ...prev, cost: e.value ?? 0 }))
                            }
                            min={0}
                            mode="currency"
                            currency="ETB"
                            locale="en-ET"
                            placeholder="Enter total cost"
                            disabled={saving}
                            inputClassName={classNames('font-bold text-lg', {
                                'p-invalid': submitted && costInvalid
                            })}
                        />
                        <FieldError show={submitted && costInvalid}>
                            Cost must be zero or greater.
                        </FieldError>
                        <FieldHint>
                            {localItem.cost
                                ? `≈ ${etbCurrencyFormatter.format(localItem.cost)}`
                                : 'Total estimated cost of the activity.'}
                        </FieldHint>
                    </StatCard>
                )}

                {hasDetailCost && (
                    <FieldError show={submitted && costInvalid}>
                        Cost must be zero or greater.
                    </FieldError>
                )}
            </SectionCard>

            {/* 4. Schedule */}
            <SectionCard
                step={4}
                icon="pi-calendar"
                title="Schedule"
                description={
                    phaseRangeText
                        ? `Dates must fall within ${phaseLabelOf(resolvedPhase)} (${phaseRangeText}).`
                        : 'Select a phase first; the activity dates must fall within it.'
                }
            >
                <div className="formgrid grid">
                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="startDate" required>
                            Start Date
                        </FieldLabel>
                        <Calendar
                            inputId="startDate"
                            value={localItem.startDate ? new Date(localItem.startDate) : null}
                            onChange={(e) =>
                                setLocalItem((prev) => ({
                                    ...prev,
                                    startDate: (e.value as Date | null) ?? undefined
                                }))
                            }
                            dateFormat="yy-mm-dd"
                            showIcon
                            minDate={phaseStart}
                            maxDate={activityEnd && phaseEnd && activityEnd < phaseEnd ? activityEnd : phaseEnd}
                            viewDate={phaseStart}
                            placeholder={phaseMissing ? 'Select a phase first' : 'Select start date'}
                            disabled={datesDisabled}
                            className={classNames({ 'p-invalid': submitted && startInvalid })}
                        />
                        <FieldError show={submitted && !phaseMissing && startDateMissing}>
                            Start date is required.
                        </FieldError>
                        <FieldError show={submitted && startBeforePhase}>
                            Start date cannot be before the phase starts ({formatDate(phaseStart)}).
                        </FieldError>
                        <FieldError show={submitted && startAfterPhase}>
                            Start date cannot be after the phase ends ({formatDate(phaseEnd)}).
                        </FieldError>
                    </div>

                    <div className="field col-12 md:col-6 mb-0">
                        <FieldLabel htmlFor="endDate" required>
                            End Date
                        </FieldLabel>
                        <Calendar
                            inputId="endDate"
                            value={localItem.endDate ? new Date(localItem.endDate) : null}
                            onChange={(e) =>
                                setLocalItem((prev) => ({
                                    ...prev,
                                    endDate: (e.value as Date | null) ?? undefined
                                }))
                            }
                            dateFormat="yy-mm-dd"
                            showIcon
                            minDate={activityStart ?? phaseStart}
                            maxDate={phaseEnd}
                            viewDate={activityStart ?? phaseStart}
                            placeholder={phaseMissing ? 'Select a phase first' : 'Select end date'}
                            disabled={datesDisabled}
                            className={classNames({ 'p-invalid': submitted && endInvalid })}
                        />
                        <FieldError show={submitted && !phaseMissing && endDateMissing}>
                            End date is required.
                        </FieldError>
                        <FieldError show={submitted && !endDateMissing && dateRangeInvalid}>
                            End date cannot be before the start date.
                        </FieldError>
                        <FieldError show={submitted && endBeforePhase}>
                            End date cannot be before the phase starts ({formatDate(phaseStart)}).
                        </FieldError>
                        <FieldError show={submitted && endAfterPhase}>
                            End date cannot be after the phase ends ({formatDate(phaseEnd)}).
                        </FieldError>
                    </div>
                </div>
            </SectionCard>
        </form>
    );
};

export default ActivityForm;
