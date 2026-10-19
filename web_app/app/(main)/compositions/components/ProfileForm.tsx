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
import { genderOptions, Gender, Accessibility } from '@/app/(main)/users/models/user.model';
import { AcademicLevel } from '@/app/(main)/organizations/models/organization.model';
import { EligibilityProfile } from '../models/profile.model';

const ACADEMIC_OPTIONS = Object.values(AcademicLevel).map((v) => ({ label: v, value: v }));
const ACCESSIBILITY_OPTIONS = Object.values(Accessibility).map((v) => ({ label: v, value: v }));

// Defaults the backend received before when only one bound was entered.
const DEFAULTS = {
    age: { min: 0, max: 120 },
    experienceYears: { min: 0, max: 50 }
} as const;

type RangeKey = keyof typeof DEFAULTS;

interface PartialRange {
    min?: number;
    max?: number;
}

type Draft = Omit<Partial<EligibilityProfile>, RangeKey> & {
    age?: PartialRange;
    experienceYears?: PartialRange;
};

const toDraft = (item?: Partial<EligibilityProfile>): Draft => ({
    ...item,
    age: item?.age && { ...item.age },
    experienceYears: item?.experienceYears && { ...item.experienceYears },
    academicLevels: item?.academicLevels ? [...item.academicLevels] : undefined,
    accessibility: item?.accessibility ? [...item.accessibility] : undefined
});

const validateRange = (label: string, range?: PartialRange): string | null => {
    if (!range) return null;
    const { min, max } = range;
    if ((min ?? 0) < 0 || (max ?? 0) < 0) return `${label} cannot be negative.`;
    if (min != null && max != null && min > max) {
        return `${label}: minimum cannot exceed maximum.`;
    }
    return null;
};

const RangeFields = ({
    idPrefix,
    title,
    unit,
    range,
    disabled,
    minPlaceholder,
    maxPlaceholder,
    onChange
}: {
    idPrefix: string;
    title: string;
    unit: string;
    range?: PartialRange;
    disabled: boolean;
    minPlaceholder: string;
    maxPlaceholder: string;
    onChange: (bound: 'min' | 'max', value: number | null) => void;
}) => (
    <div className="p-3 border-1 surface-border border-round surface-card h-full">
        <div className="flex justify-content-between align-items-center mb-3">
            <span className="font-semibold text-900">{title}</span>
            <span className="text-xs px-2 py-1 border-round surface-100 text-600">{unit}</span>
        </div>

        <div className="grid">
            <div className="col-12 sm:col-6">
                <label htmlFor={`${idPrefix}-min`} className="block text-sm text-600 mb-2">
                    Minimum
                </label>
                <InputNumber
                    inputId={`${idPrefix}-min`}
                    value={range?.min ?? null}
                    disabled={disabled}
                    onValueChange={(e) => onChange('min', e.value ?? null)}
                    min={0}
                    placeholder={minPlaceholder}
                    inputClassName="w-full"
                />
            </div>
            <div className="col-12 sm:col-6">
                <label htmlFor={`${idPrefix}-max`} className="block text-sm text-600 mb-2">
                    Maximum
                </label>
                <InputNumber
                    inputId={`${idPrefix}-max`}
                    value={range?.max ?? null}
                    disabled={disabled}
                    onValueChange={(e) => onChange('max', e.value ?? null)}
                    min={0}
                    placeholder={maxPlaceholder}
                    inputClassName="w-full"
                />
            </div>
        </div>
    </div>
);

const ProfileForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<EligibilityProfile>) => {
    // The form is mounted when the dialog opens, so state starts fresh each time.
    const [localItem, setLocalItem] = useState<Draft>(() => toDraft(item!));
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const nameMissing = !localItem.name?.trim();

    const update = <K extends keyof Draft>(field: K, value: Draft[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const updateRange = (key: RangeKey, bound: 'min' | 'max', value: number | null) => {
        setLocalItem((prev) => {
            const next: PartialRange = { ...(prev[key] ?? {}), [bound]: value ?? undefined };
            const copy = { ...prev };

            // Both bounds empty -> remove the range so it isn't enforced
            if (next.min === undefined && next.max === undefined) delete copy[key];
            else copy[key] = next;

            return copy;
        });
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing) return;

        const error =
            validateRange('Age', localItem.age) ??
            validateRange('Experience', localItem.experienceYears);
        if (error) {
            setFormError(error);
            return;
        }

        // The API expects both bounds, so fill any blank one with its default.
        const complete = (key: RangeKey) =>
            localItem[key]
                ? {
                      min: localItem[key]!.min ?? DEFAULTS[key].min,
                      max: localItem[key]!.max ?? DEFAULTS[key].max
                  }
                : undefined;

        await onSubmit({
            ...localItem,
            name: localItem.name!.trim(),
            description: localItem.description?.trim() || undefined,
            age: complete('age'),
            experienceYears: complete('experienceYears')
        } as EligibilityProfile);
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {/* Name */}
            <div className="field mb-4">
                <label htmlFor="name" className="font-bold text-sm block mb-2">
                    Profile name <span className="text-red-500">*</span>
                </label>
                <InputText
                    id="name"
                    value={localItem.name ?? ''}
                    disabled={saving}
                    onChange={(e) => update('name', e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. Senior Academic / Female Researcher Criteria"
                    className={classNames({ 'p-invalid': submitted && nameMissing })}
                />
                {submitted && nameMissing && (
                    <small className="p-error">Profile name is required.</small>
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
                    placeholder="Purpose or demographic scope (optional)"
                />
            </div>

            {/* Gender */}
            <div className="field mb-4">
                <label htmlFor="gender" className="font-bold text-sm block mb-2">
                    Gender target
                </label>
                <Dropdown
                    inputId="gender"
                    value={localItem.gender ?? null}
                    options={genderOptions}
                    disabled={saving}
                    onChange={(e) => update('gender', (e.value ?? undefined) as Gender | undefined)}
                    placeholder="Any gender"
                    showClear
                />
            </div>

            {/* Ranges */}
            <div className="grid mb-2">
                <div className="col-12 md:col-6">
                    <RangeFields
                        idPrefix="age"
                        title="Age"
                        unit="years"
                        range={localItem.age}
                        disabled={saving}
                        minPlaceholder="e.g. 25"
                        maxPlaceholder="e.g. 65"
                        onChange={(b, v) => updateRange('age', b, v)}
                    />
                </div>
                <div className="col-12 md:col-6">
                    <RangeFields
                        idPrefix="experience"
                        title="Experience"
                        unit="years"
                        range={localItem.experienceYears}
                        disabled={saving}
                        minPlaceholder="e.g. 3"
                        maxPlaceholder="e.g. 30"
                        onChange={(b, v) => updateRange('experienceYears', b, v)}
                    />
                </div>
            </div>
            <small className="text-500 block mb-4">
                Leave both fields of a range empty to skip it.
            </small>

            {/* Academic levels */}
            <div className="field mb-4">
                <label htmlFor="academicLevels" className="font-bold text-sm block mb-2">
                    Academic levels required
                </label>
                <MultiSelect
                    inputId="academicLevels"
                    value={localItem.academicLevels ?? []}
                    options={ACADEMIC_OPTIONS}
                    disabled={saving}
                    onChange={(e) => update('academicLevels', e.value)}
                    placeholder="Any level"
                    display="chip"
                    filter
                />
            </div>

            {/* Accessibility */}
            <div className="field mb-2">
                <label htmlFor="accessibility" className="font-bold text-sm block mb-2">
                    Accessibility requirements
                </label>
                <MultiSelect
                    inputId="accessibility"
                    value={localItem.accessibility ?? []}
                    options={ACCESSIBILITY_OPTIONS}
                    disabled={saving}
                    onChange={(e) => update('accessibility', e.value)}
                    placeholder="No specific requirement"
                    display="chip"
                    filter
                />
            </div>

            {formError && (
                <Message severity="error" text={formError} className="w-full mt-3 justify-content-start" />
            )}
        </form>
    );
};

export default ProfileForm;