'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

import {
    MemberRequirement,
    AggregationMode,
    validateMemberRequirement
} from '../models/requirement.model';
import { EligibilityProfile } from '../models/profile.model';
import { HistoryRule } from '../models/history.model';
import { ProfileApi } from '../api/profile.api';
import { HistoryApi } from '../api/history.api';

import HistoryRuleRefList, {
    LookupOption,
    normalizeRefs,
    toLookupOptions
} from './HistoryRuleRefList';

const MODE_OPTIONS = Object.values(AggregationMode).map((m) => ({ label: m, value: m }));

type Draft = Partial<MemberRequirement>;

const toDraft = (item?: Draft): Draft => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    profile: (typeof item?.profile === 'object'
        ? (item.profile as EligibilityProfile)?._id
        : item?.profile) as MemberRequirement['profile'],
    historyRules: normalizeRefs(item?.historyRules),
    mode: item?.mode || AggregationMode.COUNT,
    // Infinity (or null after JSON) means "no ceiling"
    threshold: {
        min: item?.threshold?.min ?? 0,
        max: item?.threshold?.max ?? Infinity
    }
});

const RequirementForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<MemberRequirement>) => {
    const toast = useToast();

    // The form is mounted when the dialog opens, so state starts fresh each time.
    const [localItem, setLocalItem] = useState<Draft>(() => toDraft(item!));
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [profileOptions, setProfileOptions] = useState<LookupOption[]>([]);
    const [historyOptions, setHistoryOptions] = useState<LookupOption[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const [profiles, histories] = await Promise.all([
                    ProfileApi.getAll(),
                    HistoryApi.getAll()
                ]);
                if (cancelled) return;
                setProfileOptions(toLookupOptions((profiles || []) as EligibilityProfile[]));
                setHistoryOptions(toLookupOptions((histories || []) as HistoryRule[]));
            } catch (err: any) {
                if (!cancelled) toast.error(err?.message || 'Failed to load reference options.');
            } finally {
                if (!cancelled) setLoadingOptions(false);
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const nameMissing = !localItem.name?.trim();
    const isRatio = localItem.mode === AggregationMode.RATIO;
    const refs = localItem.historyRules ?? [];
    const hasEmptyRef = refs.some((hr) => !hr.rule);

    const update = <K extends keyof MemberRequirement>(field: K, value: Draft[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const updateThreshold = (bound: 'min' | 'max', value: number | null) => {
        setLocalItem((prev) => ({
            ...prev,
            threshold: {
                min: bound === 'min' ? (value ?? 0) : (prev.threshold?.min ?? 0),
                max: bound === 'max' ? (value ?? Infinity) : (prev.threshold?.max ?? Infinity)
            }
        }));
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing || hasEmptyRef) return;

        const payload = {
            ...localItem,
            name: localItem.name!.trim(),
            description: localItem.description?.trim() || undefined
        } as MemberRequirement;

        const base = validateMemberRequirement(payload);
        if (!base.valid) {
            setFormError(base.message ?? 'Requirement is invalid.');
            return;
        }

        if (isRatio) {
            const { min, max } = payload.threshold;
            if (min > 1 || (max !== Infinity && max > 1)) {
                setFormError('Ratio thresholds must be between 0.0 and 1.0 (e.g. 0.40 for 40%).');
                return;
            }
        }

        await onSubmit(payload);
    };

    const max = localItem.threshold?.max;

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {/* Name */}
            <div className="field mb-4">
                <label htmlFor="name" className="font-bold text-sm block mb-2">
                    Requirement name <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="name"
                    value={localItem.name ?? ''}
                    disabled={saving}
                    onChange={(e) => update('name', e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. Minimum 2 PhD members or 30% women researchers"
                    className={classNames({ 'p-invalid': submitted && nameMissing })}
                />
                {submitted && nameMissing && (
                    <small className="p-error">Requirement name is required.</small>
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
                    onChange={(e) => update('description', e.target.value)}
                    rows={2}
                    autoResize
                    placeholder="Intent of this team member constraint (optional)"
                />
            </div>

            {/* Profile filter */}
            <div className="field mb-4">
                <label htmlFor="profile" className="font-bold text-sm block mb-2">
                    Demographic eligibility filter
                </label>
                <Dropdown
                    inputId="profile"
                    value={(localItem.profile as string) ?? null}
                    options={profileOptions}
                    disabled={saving || loadingOptions}
                    onChange={(e) =>
                        update('profile', (e.value ?? undefined) as MemberRequirement['profile'])
                    }
                    placeholder={loadingOptions ? 'Loading…' : 'Select profile (optional)'}
                    showClear
                    filter
                />
            </div>

            {/* History references */}
            <div className="mb-4">
                <HistoryRuleRefList
                    title="History performance references"
                    value={refs}
                    options={historyOptions}
                    disabled={saving}
                    loading={loadingOptions}
                    showErrors={submitted}
                    onChange={(next) => update('historyRules', next)}
                />
            </div>

            {/* Aggregation */}
            <div className="p-3 border-1 surface-border border-round surface-card">
                <div className="flex align-items-center gap-2 mb-3">
                    <i className="pi pi-sliders-h text-primary" />
                    <span className="font-semibold text-900">Aggregation</span>
                </div>

                <div className="field mb-3">
                    <label htmlFor="mode" className="block text-sm text-600 mb-2">
                        Mode <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        inputId="mode"
                        value={localItem.mode}
                        options={MODE_OPTIONS}
                        disabled={saving}
                        onChange={(e) => update('mode', e.value as AggregationMode)}
                        placeholder="Select mode"
                    />
                    <small className="text-500 block mt-1">
                        {isRatio
                            ? 'RATIO evaluates the proportion of matching members (0.00 to 1.00).'
                            : 'COUNT evaluates the exact number of matching members.'}
                    </small>
                </div>

                <div className="grid">
                    <div className="col-12 sm:col-6">
                        <label htmlFor="threshold-min" className="block text-sm text-600 mb-2">
                            Minimum
                        </label>
                        <InputNumber
                            inputId="threshold-min"
                            value={localItem.threshold?.min ?? null}
                            disabled={saving}
                            onValueChange={(e) => updateThreshold('min', e.value ?? null)}
                            min={0}
                            max={isRatio ? 1 : undefined}
                            minFractionDigits={0}
                            maxFractionDigits={isRatio ? 2 : 0}
                            placeholder={isRatio ? 'e.g. 0.30' : 'e.g. 2'}
                            inputClassName="w-full"
                        />
                    </div>

                    <div className="col-12 sm:col-6">
                        <label htmlFor="threshold-max" className="block text-sm text-600 mb-2">
                            Maximum
                        </label>
                        <InputNumber
                            inputId="threshold-max"
                            value={max === Infinity || max == null ? null : max}
                            disabled={saving}
                            onValueChange={(e) => updateThreshold('max', e.value ?? null)}
                            min={0}
                            max={isRatio ? 1 : undefined}
                            minFractionDigits={0}
                            maxFractionDigits={isRatio ? 2 : 0}
                            placeholder="No ceiling"
                            inputClassName="w-full"
                        />
                    </div>
                </div>
            </div>

            {formError && (
                <Message severity="error" text={formError} className="w-full mt-3 justify-content-start" />
            )}
        </form>
    );
};

export default RequirementForm;