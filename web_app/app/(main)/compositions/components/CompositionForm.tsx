'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

import { Composition, AggregationMode, IMemberRule, validateComposition } from '../models/composition.model';
import { IMemberRequirement } from '../models/requirement.model';
import { MemberRequirementApi } from '../api/requirement.api';
import { IRange } from '@/types/range';

const MODE_OPTIONS = Object.values(AggregationMode).map((m) => ({ label: m, value: m }));

type Draft = Partial<Composition>;

const idOf = (value: unknown): string | undefined =>
    typeof value === 'object' && value !== null
        ? (value as { _id?: string })._id
        : (value as string | undefined);

const toDraft = (item?: Draft): Draft => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    leadRule: idOf(item?.leadRule) as Composition['leadRule'],
    memberRules: Array.isArray(item?.memberRules)
        ? item!.memberRules.map((mr) => ({
              requirement: idOf(mr.requirement) ?? '',
              mode: mr.mode ?? AggregationMode.COUNT,
              threshold: {
                  min: mr.threshold?.min ?? 0,
                  max: mr.threshold?.max ?? undefined
              }
          }))
        : []
});

const Section = ({
    icon,
    title,
    subtitle,
    children
}: {
    icon: string;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) => (
    <section className="mb-4">
        <div className="flex align-items-center gap-2 mb-3">
            <i className={`${icon} text-primary`} />
            <div>
                <div className="font-semibold text-900">{title}</div>
                {subtitle && <small className="text-500">{subtitle}</small>}
            </div>
        </div>
        {children}
    </section>
);

const CompositionForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Composition>) => {
    const toast = useToast();

    const [localItem, setLocalItem] = useState<Draft>(() => toDraft(item ?? undefined));
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [requirementOptions, setRequirementOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const requirements = await MemberRequirementApi.getAll();
                if (cancelled) return;

                setRequirementOptions(
                    ((requirements || []) as IMemberRequirement[]).map((r) => ({
                        label: r.name,
                        value: r._id!
                    }))
                );
            } catch (err: any) {
                if (!cancelled) {
                    toast.error(err?.message || 'Failed to load reference rules.');
                }
            } finally {
                if (!cancelled) setLoadingOptions(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const nameMissing = !localItem.name?.trim();
    const memberRules = (localItem.memberRules as IMemberRule[]) ?? [];

    const update = <K extends keyof Composition>(field: K, value: Draft[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const updateMemberRule = (index: number, key: keyof IMemberRule, value: any) => {
        setLocalItem((prev) => {
            const rules = [...((prev.memberRules as IMemberRule[]) || [])];
            rules[index] = { ...rules[index], [key]: value };
            return { ...prev, memberRules: rules };
        });
        setFormError(null);
    };

    const updateMemberThreshold = (index: number, bound: 'min' | 'max', value: number | null) => {
        setLocalItem((prev) => {
            const rules = [...((prev.memberRules as IMemberRule[]) || [])];
            const currentThreshold = rules[index].threshold || { min: 0 };
            rules[index] = {
                ...rules[index],
                threshold: {
                    ...currentThreshold,
                    [bound]: value ?? undefined
                }
            };
            return { ...prev, memberRules: rules };
        });
        setFormError(null);
    };

    const addMemberRule = () => {
        setLocalItem((prev) => ({
            ...prev,
            memberRules: [
                ...((prev.memberRules as IMemberRule[]) || []),
                {
                    requirement: '',
                    mode: AggregationMode.COUNT,
                    threshold: { min: 0, max: 300 } as IRange
                }
            ]
        }));
    };

    const removeMemberRule = (index: number) => {
        setLocalItem((prev) => ({
            ...prev,
            memberRules: ((prev.memberRules as IMemberRule[]) || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing) return;

        const payload = {
            ...localItem,
            name: localItem.name!.trim(),
            description: localItem.description?.trim() || undefined
        } as Composition;

        const validation = validateComposition(payload);
        if (!validation.valid) {
            setFormError(validation.message ?? 'Composition is invalid.');
            return;
        }

        await onSubmit(payload);
    };

    const lookupPlaceholder = (text: string) => (loadingOptions ? 'Loading…' : text);

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            <Section icon="pi pi-info-circle" title="Basic information">
                <div className="field mb-3">
                    <label htmlFor="name" className="font-bold text-sm block mb-2">
                        Composition name <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        id="name"
                        value={localItem.name ?? ''}
                        disabled={saving}
                        onChange={(e) => update('name', e.target.value)}
                        required
                        autoFocus
                        placeholder="e.g. Standard Multidisciplinary Research Team"
                        className={classNames({ 'p-invalid': submitted && nameMissing })}
                    />
                    {submitted && nameMissing && (
                        <small className="p-error">Composition name is required.</small>
                    )}
                </div>

                <div className="field mb-0">
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
                        placeholder="Summarize the purpose of this team structure (optional)"
                    />
                </div>
            </Section>

            <Section
                icon="pi pi-user"
                title="Team lead rule"
                subtitle="Constraint requirement on the principal investigator."
            >
                <div className="field mb-3">
                    <label htmlFor="leadRule" className="block text-sm text-600 mb-2">
                        Lead requirement rule
                    </label>
                    <Dropdown
                        inputId="leadRule"
                        value={(localItem.leadRule as string) ?? null}
                        options={requirementOptions}
                        disabled={saving || loadingOptions}
                        onChange={(e) => update('leadRule', e.value ?? undefined)}
                        placeholder={lookupPlaceholder('Select lead requirement rule (optional)')}
                        showClear
                        filter
                    />
                </div>
            </Section>

            <Section
                icon="pi pi-users"
                title="Team member rules"
                subtitle="Aggregated requirements and thresholds applied to the team."
            >
                {memberRules.map((mr, idx) => {
                    const isRatio = mr.mode === AggregationMode.RATIO;
                    return (
                        <div key={idx} className="p-3 border-1 surface-border border-round surface-card mb-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <span className="font-semibold text-sm text-900">Rule #{idx + 1}</span>
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    text
                                    rounded
                                    disabled={saving}
                                    onClick={() => removeMemberRule(idx)}
                                />
                            </div>

                            <div className="field mb-3">
                                <label className="block text-sm text-600 mb-1">Requirement</label>
                                <Dropdown
                                    value={mr.requirement}
                                    options={requirementOptions}
                                    disabled={saving || loadingOptions}
                                    onChange={(e) => updateMemberRule(idx, 'requirement', e.value)}
                                    placeholder={lookupPlaceholder('Select requirement')}
                                    filter
                                />
                            </div>

                            <div className="field mb-3">
                                <label className="block text-sm text-600 mb-1">Aggregation Mode</label>
                                <Dropdown
                                    value={mr.mode}
                                    options={MODE_OPTIONS}
                                    disabled={saving}
                                    onChange={(e) => updateMemberRule(idx, 'mode', e.value)}
                                    placeholder="Select mode"
                                />
                            </div>

                            <div className="grid">
                                <div className="col-12 sm:col-6">
                                    <label className="block text-sm text-600 mb-1">Minimum</label>
                                    <InputNumber
                                        value={mr.threshold?.min ?? null}
                                        disabled={saving}
                                        onValueChange={(e) => updateMemberThreshold(idx, 'min', e.value ?? null)}
                                        min={0}
                                        max={isRatio ? 1 : undefined}
                                        minFractionDigits={0}
                                        maxFractionDigits={isRatio ? 2 : 0}
                                        placeholder={isRatio ? 'e.g. 0.30' : 'e.g. 1'}
                                        inputClassName="w-full"
                                    />
                                </div>
                                <div className="col-12 sm:col-6">
                                    <label className="block text-sm text-600 mb-1">Maximum</label>
                                    <InputNumber
                                        value={mr.threshold?.max ?? null}
                                        disabled={saving}
                                        onValueChange={(e) => updateMemberThreshold(idx, 'max', e.value ?? null)}
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
                    );
                })}

                <Button
                    type="button"
                    label="Add Member Rule"
                    icon="pi pi-plus"
                    outlined
                    size="small"
                    disabled={saving || loadingOptions}
                    onClick={addMemberRule}
                />
            </Section>

            {formError && (
                <Message severity="error" text={formError} className="w-full justify-content-start mt-3" />
            )}
        </form>
    );
};

export default CompositionForm;