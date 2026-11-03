'use client';

import { FormEvent, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import {
    IHistoryRule,
    HistoryContext,
    HistoryParticipation,
    validateHistoryRule
} from '../models/history.model';
import { ProjectStatus } from '../../projects/models/project.model';
import { IRange } from '@/types/range';

/* ---------- Config ---------- */

const CONTEXT_OPTIONS = Object.values(HistoryContext).map((c) => ({
    label: c.charAt(0) + c.slice(1).toLowerCase(),
    value: c
}));

const PARTICIPATION_OPTIONS = [
    { label: 'Lead PI', value: HistoryParticipation.LEAD },
    { label: 'Member', value: HistoryParticipation.MEMBER },
    { label: 'Any', value: HistoryParticipation.ANY }
];

const METRIC_OPTIONS = Object.values(ProjectStatus).map((m) => ({
    label: m,
    value: m
}));

type Draft = Partial<IHistoryRule>;

const emptyRule = (): Draft => ({
    name: '',
    description: '',
    context: HistoryContext.CALL,
    participation: HistoryParticipation.ANY,
    metrics: [],
    sumRange: { min: 0, max: undefined } as unknown as IRange // or cast appropriately depending on IRange definition
});

const cloneRule = (item: Draft): Draft => ({
    ...item,
    metrics: item.metrics ? [...item.metrics] : [],
    sumRange: item.sumRange ? { ...item.sumRange } : ({ min: undefined, max: undefined } as unknown as IRange)
});
/* ---------- Form ---------- */

const HistoryForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<IHistoryRule>) => {
    const [localItem, setLocalItem] = useState<Draft>(() =>
        item ? cloneRule(item) : emptyRule()
    );
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const nameMissing = !localItem.name?.trim();
    const contextMissing = !localItem.context;
    const participationMissing = !localItem.participation;
    const metricsMissing = !localItem.metrics || localItem.metrics.length === 0;

    const updateField = <K extends keyof IHistoryRule>(
        field: K,
        value: IHistoryRule[K]
    ) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const updateBound = (bound: 'min' | 'max', value: number | null) => {
        setLocalItem((prev) => ({
            ...prev,
            sumRange: {
                ...(prev.sumRange ?? {}),
                [bound]: value ?? undefined
            } as any
        }));
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing || contextMissing || participationMissing || metricsMissing) return;

        const payload = {
            ...localItem,
            name: localItem.name!.trim(),
            description: localItem.description?.trim() || undefined
        } as IHistoryRule;

        const validation = validateHistoryRule(payload);
        if (!validation.valid) {
            setFormError(validation.message ?? 'History rule is invalid.');
            return;
        }

        await onSubmit(payload);
    };

    // Plain-language summary
    const summary = (() => {
        const metrics = localItem.metrics ?? [];
        if (metrics.length === 0) return null;
        const { min, max } = localItem.sumRange ?? {};
        const bounds =
            min != null && max != null ? `between ${min} and ${max}`
                : min != null ? `at least ${min}`
                    : max != null ? `at most ${max}`
                        : 'any amount';
        return `Sums [${metrics.join(' + ')}] — total must be ${bounds}.`;
    })();

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {/* Name */}
            <div className="field mb-4">
                <label htmlFor="name" className="font-bold text-sm block mb-2">
                    Rule name <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="name"
                    value={localItem.name ?? ''}
                    disabled={saving}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. Minimum Completed Projects"
                    className={classNames({ 'p-invalid': submitted && nameMissing })}
                />
                {submitted && nameMissing && (
                    <small className="p-error">Rule name is required.</small>
                )}
            </div>

            {/* Description */}
            <div className="field mb-4">
                <label htmlFor="description" className="font-bold text-sm block mb-2">
                    Description
                </label>
                <InputTextarea
                    id="description"
                    value={localItem.description ?? ''}
                    disabled={saving}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={2}
                    autoResize
                    placeholder="Describe the rule requirements (optional)"
                />
            </div>

            <div className="formgrid grid">
                {/* Context */}
                <div className="field col-12 md:col-6 mb-4">
                    <label htmlFor="context" className="font-bold text-sm block mb-2">
                        Context <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        inputId="context"
                        value={localItem.context}
                        options={CONTEXT_OPTIONS}
                        disabled={saving}
                        onChange={(e) => updateField('context', e.value)}
                        placeholder="Select context"
                        className={classNames({ 'p-invalid': submitted && contextMissing })}
                    />
                    {submitted && contextMissing && (
                        <small className="p-error">Context is required.</small>
                    )}
                </div>

                {/* Participation */}
                <div className="field col-12 md:col-6 mb-4">
                    <label htmlFor="participation" className="font-bold text-sm block mb-2">
                        Participation <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        inputId="participation"
                        value={localItem.participation}
                        options={PARTICIPATION_OPTIONS}
                        disabled={saving}
                        onChange={(e) => updateField('participation', e.value)}
                        placeholder="Select participation"
                        className={classNames({ 'p-invalid': submitted && participationMissing })}
                    />
                    {submitted && participationMissing && (
                        <small className="p-error">Participation is required.</small>
                    )}
                </div>
            </div>

            {/* Aggregated Rule Box */}
            <div className="p-3 border-1 surface-border border-round surface-card mb-4">
                <div className="flex align-items-center gap-2 mb-1">
                    <i className="pi pi-chart-bar text-primary" />
                    <span className="font-semibold text-900">Metrics & Sum Range <span className="text-red-500">*</span></span>
                </div>
                <small className="text-500 block mb-3">
                    Select the statuses to track and specify the acceptable aggregate range.
                </small>

                <div className="field mb-3">
                    <label htmlFor="metrics" className="block text-sm text-600 mb-2">
                        Metrics to sum <span className="text-red-500">*</span>
                    </label>
                    <MultiSelect
                        inputId="metrics"
                        value={localItem.metrics ?? []}
                        options={METRIC_OPTIONS}
                        disabled={saving}
                        onChange={(e) => updateField('metrics', e.value)}
                        placeholder="Select metrics..."
                        display="chip"
                        className={classNames({ 'p-invalid': submitted && metricsMissing })}
                    />
                    {submitted && metricsMissing && (
                        <small className="p-error block mt-1">At least one metric is required.</small>
                    )}
                </div>

                <div className="grid">
                    <div className="col-12 sm:col-6">
                        <label htmlFor="sumRange-min" className="block text-sm text-600 mb-2">
                            Sum Minimum
                        </label>
                        <InputNumber
                            inputId="sumRange-min"
                            value={localItem.sumRange?.min ?? null}
                            disabled={saving}
                            onValueChange={(e) => updateBound('min', e.value ?? null)}
                            min={0}
                            placeholder="No minimum"
                            inputClassName="w-full"
                        />
                    </div>

                    <div className="col-12 sm:col-6">
                        <label htmlFor="sumRange-max" className="block text-sm text-600 mb-2">
                            Sum Maximum
                        </label>
                        <InputNumber
                            inputId="sumRange-max"
                            value={localItem.sumRange?.max ?? null}
                            disabled={saving}
                            onValueChange={(e) => updateBound('max', e.value ?? null)}
                            min={0}
                            placeholder="No maximum"
                            inputClassName="w-full"
                        />
                    </div>
                </div>

                {summary && (
                    <div className="flex align-items-center gap-2 mt-3 text-sm text-600">
                        <i className="pi pi-info-circle text-primary" />
                        <span>{summary}</span>
                    </div>
                )}
            </div>

            {formError && (
                <Message severity="error" text={formError} className="w-full mt-3 justify-content-start" />
            )}
        </form>
    );
};

export default HistoryForm;