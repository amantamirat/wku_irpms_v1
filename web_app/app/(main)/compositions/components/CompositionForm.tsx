'use client';

import { FormEvent, useEffect, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

import { Composition, validateComposition } from '../models/composition.model';
import { EligibilityProfile } from '../models/profile.model';
import { HistoryRule } from '../models/history.model';
import { MemberRequirement } from '../models/requirement.model';
import { ProfileApi } from '../api/profile.api';
import { HistoryApi } from '../api/history.api';
import { MemberRequirementApi } from '../api/requirement.api';

import HistoryRuleRefList, {
    LookupOption,
    normalizeRefs,
    toLookupOptions
} from './HistoryRuleRefList';

type Draft = Partial<Composition>;

const idOf = (value: unknown): string | undefined =>
    typeof value === 'object' && value !== null
        ? (value as { _id?: string })._id
        : (value as string | undefined);

const toDraft = (item?: Draft): Draft => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    leadProfileRule: idOf(item?.leadProfileRule) as Composition['leadProfileRule'],
    leadHistoryRules: normalizeRefs(item?.leadHistoryRules),
    memberRequirements: (Array.isArray(item?.memberRequirements)
        ? (item!.memberRequirements as Array<string | MemberRequirement>)
              .map(idOf)
              .filter(Boolean)
        : []) as Composition['memberRequirements']
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

    // The form is mounted when the dialog opens, so state starts fresh each time.
    const [localItem, setLocalItem] = useState<Draft>(() => toDraft(item!));
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [profileOptions, setProfileOptions] = useState<LookupOption[]>([]);
    const [historyOptions, setHistoryOptions] = useState<LookupOption[]>([]);
    const [requirementOptions, setRequirementOptions] = useState<LookupOption[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const [profiles, histories, requirements] = await Promise.all([
                    ProfileApi.getAll(),
                    HistoryApi.getAll(),
                    MemberRequirementApi.getAll()
                ]);
                if (cancelled) return;

                setProfileOptions(toLookupOptions((profiles || []) as EligibilityProfile[]));
                setHistoryOptions(toLookupOptions((histories || []) as HistoryRule[]));
                setRequirementOptions(
                    ((requirements || []) as MemberRequirement[])
                        .filter((r) => r._id)
                        .map((r) => ({
                            label: `${r.name} [${r.mode}]`,
                            value: r._id as string
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const nameMissing = !localItem.name?.trim();
    const refs = localItem.leadHistoryRules ?? [];
    const hasEmptyRef = refs.some((hr) => !hr.rule);

    const update = <K extends keyof Composition>(field: K, value: Draft[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
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
                title="Team lead rules"
                subtitle="Constraints on the principal investigator."
            >
                <div className="field mb-3">
                    <label htmlFor="leadProfileRule" className="block text-sm text-600 mb-2">
                        Lead eligibility profile
                    </label>
                    <Dropdown
                        inputId="leadProfileRule"
                        value={(localItem.leadProfileRule as string) ?? null}
                        options={profileOptions}
                        disabled={saving || loadingOptions}
                        onChange={(e) =>
                            update('leadProfileRule', (e.value ?? undefined) as Composition['leadProfileRule'])
                        }
                        placeholder={lookupPlaceholder('Select profile (optional)')}
                        showClear
                        filter
                    />
                </div>

                <HistoryRuleRefList
                    title="Lead history references"
                    value={refs}
                    options={historyOptions}
                    disabled={saving}
                    loading={loadingOptions}
                    showErrors={submitted}
                    onChange={(next) => update('leadHistoryRules', next)}
                />
            </Section>

            <Section
                icon="pi pi-users"
                title="Team member requirements"
                subtitle="Aggregation rules applied to the rest of the team."
            >
                <MultiSelect
                    inputId="memberRequirements"
                    value={(localItem.memberRequirements as string[]) ?? []}
                    options={requirementOptions}
                    disabled={saving || loadingOptions}
                    onChange={(e) =>
                        update('memberRequirements', e.value as Composition['memberRequirements'])
                    }
                    placeholder={lookupPlaceholder('Select member requirements')}
                    display="chip"
                    filter
                />
            </Section>

            {formError && (
                <Message severity="error" text={formError} className="w-full justify-content-start" />
            )}
        </form>
    );
};

export default CompositionForm;