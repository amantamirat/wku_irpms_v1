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
import { IRange } from '@/types/range';
import {
    HistoryRule,
    HistoryMetric,
    HistoryParticipation,
    validateHistoryRule
} from '../models/history.model';

/* ---------- Config (stable references) ---------- */

const PARTICIPATION_OPTIONS = [
    { label: 'Lead PI', value: HistoryParticipation.LEAD },
    { label: 'Member', value: HistoryParticipation.MEMBER },
    { label: 'Any', value: HistoryParticipation.ANY }
];

const METRIC_OPTIONS = Object.values(HistoryMetric).map((m) => ({
    label: m,
    value: m
}));

type Draft = Partial<HistoryRule>;

const emptyRule = (): Draft => ({
    name: '',
    description: '',
    participation: HistoryParticipation.ANY
});

// Deep-copy so editing never mutates the original item.
const cloneRule = (item: Draft): Draft => ({
    ...item,
    total: item.total
        ? { ...item.total, fields: [...item.total.fields], range: item.total.range && { ...item.total.range } }
        : undefined
});

/**
 * Sets or clears `total`. When there are no fields and no bounds,
 * the total rule is removed so it isn't enforced.
 */
const applyTotal = (
    prev: Draft,
    fields: HistoryMetric[],
    range: Partial<IRange>
): Draft => {
    const next = { ...prev };
    const isEmpty =
        fields.length === 0 &&
        range.min === undefined &&
        range.max === undefined;

    if (isEmpty) {
        delete next.total;
    } else {
        next.total = { fields, range: range as IRange };
    }
    return next;
};

/* ---------- Form ---------- */

const HistoryForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<HistoryRule>) => {
    // The form is mounted when the dialog opens, so state starts fresh each time.
    const [localItem, setLocalItem] = useState<Draft>(() =>
        item ? cloneRule(item) : emptyRule()
    );
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const nameMissing = !localItem.name?.trim();
    const participationMissing = !localItem.participation;

    const total = localItem.total;
    const selectedFields = total?.fields ?? [];

    const updateField = <K extends keyof HistoryRule>(
        field: K,
        value: HistoryRule[K]
    ) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const updateFields = (fields: HistoryMetric[]) => {
        setLocalItem((prev) =>
            applyTotal(prev, fields, prev.total?.range ?? {})
        );
        setFormError(null);
    };

    const updateBound = (bound: 'min' | 'max', value: number | null) => {
        setLocalItem((prev) =>
            applyTotal(prev, prev.total?.fields ?? [], {
                ...(prev.total?.range ?? {}),
                [bound]: value ?? undefined
            })
        );
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing || participationMissing) return;

        const payload = {
            ...localItem,
            name: localItem.name!.trim(),
            description: localItem.description?.trim() || undefined
        } as HistoryRule;

        const validation = validateHistoryRule(payload);
        if (!validation.valid) {
            setFormError(validation.message ?? 'History rule is invalid.');
            return;
        }

        await onSubmit(payload);
    };

    // Plain-language preview of what the rule means
    const summary = (() => {
        if (!total || selectedFields.length === 0) return null;
        const { min, max } = total.range ?? {};
        const bounds =
            min != null && max != null ? `between ${min} and ${max}`
            : min != null ? `at least ${min}`
            : max != null ? `at most ${max}`
            : 'any amount';
        return `Counts ${selectedFields.join(' + ')} — total must be ${bounds}.`;
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
                    placeholder="e.g. Experienced Lead Researcher"
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
                    placeholder="Describe the historical requirements for this rule (optional)"
                />
            </div>

            {/* Participation */}
            <div className="field mb-4">
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

                {submitted && participationMissing ? (
                    <small className="p-error">Please select a participation type.</small>
                ) : (
                    <small className="text-500 block mt-1">
                        Whether history counts for projects where the user was the lead PI, a member, or either.
                    </small>
                )}
            </div>

            {/* Total aggregated rule */}
            <div className="p-3 border-1 surface-border border-round surface-card">
                <div className="flex align-items-center gap-2 mb-1">
                    <i className="pi pi-chart-bar text-primary" />
                    <span className="font-semibold text-900">Aggregated history</span>
                </div>
                <small className="text-500 block mb-3">
                    Sum the selected metrics and require the total to fall within a range.
                    Leave everything empty to skip this rule.
                </small>

                <div className="field mb-3">
                    <label htmlFor="total-fields" className="block text-sm text-600 mb-2">
                        Metrics to sum
                    </label>
                    <MultiSelect
                        inputId="total-fields"
                        value={selectedFields}
                        options={METRIC_OPTIONS}
                        disabled={saving}
                        onChange={(e) => updateFields(e.value)}
                        placeholder="Select metrics..."
                        display="chip"
                    />
                </div>

                <div className="grid">
                    <div className="col-12 sm:col-6">
                        <label htmlFor="total-min" className="block text-sm text-600 mb-2">
                            Total minimum
                        </label>
                        <InputNumber
                            inputId="total-min"
                            value={total?.range?.min ?? null}
                            disabled={saving}
                            onValueChange={(e) => updateBound('min', e.value ?? null)}
                            min={0}
                            placeholder="No minimum"
                            inputClassName="w-full"
                        />
                    </div>

                    <div className="col-12 sm:col-6">
                        <label htmlFor="total-max" className="block text-sm text-600 mb-2">
                            Total maximum
                        </label>
                        <InputNumber
                            inputId="total-max"
                            value={total?.range?.max ?? null}
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
                        <i className="pi pi-info-circle" />
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