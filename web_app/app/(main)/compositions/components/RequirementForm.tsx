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

import {
    IMemberRequirement,
    validateMemberRequirement
} from '../models/requirement.model';
import { EligibilityProfile } from '../models/profile.model';
import { IHistoryRule } from '../models/history.model';
import { ProfileApi } from '../api/profile.api';
import { HistoryApi } from '../api/history.api';
import { extractId } from '@/utils/utils';

type Draft = Partial<IMemberRequirement>;

type Option = { label: string; value: string };

// Unique, truthy ids only
const toIdList = (list?: any[] | null): string[] =>
    Array.from(
        new Set(
            (list ?? [])
                .map((v) => extractId(v))
                .filter((id): id is string => Boolean(id))
        )
    );

const toDraft = (item?: IMemberRequirement | null): Draft => ({
    _id: item?._id,
    name: item?.name ?? '',
    description: item?.description ?? '',
    profile: extractId(item?.profile) as any,
    historyRules: toIdList(item?.historyRules as any[]) as any
});

const RequirementForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<IMemberRequirement>) => {
    const toast = useToast();

    const [localItem, setLocalItem] = useState<Draft>(() => toDraft(item));
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [profileOptions, setProfileOptions] = useState<Option[]>([]);
    const [historyOptions, setHistoryOptions] = useState<Option[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const [profiles, histories] = await Promise.all([
                    ProfileApi.getAll(),
                    HistoryApi.getAll()
                ]);
                if (cancelled) return;

                setProfileOptions(
                    ((profiles || []) as EligibilityProfile[]).map((p) => ({
                        label: p.name,
                        value: p._id!
                    }))
                );

                // Dedupe by _id so option keys are always unique
                const seen = new Set<string>();
                setHistoryOptions(
                    ((histories || []) as IHistoryRule[])
                        .filter((h) => h._id && !seen.has(h._id) && seen.add(h._id))
                        .map((h) => ({
                            label: h.name,
                            value: h._id!
                        }))
                );
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
    const historyRulesMissing = !localItem.historyRules || localItem.historyRules.length === 0;

    const update = <K extends keyof IMemberRequirement>(field: K, value: Draft[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing || historyRulesMissing) return;

        const payload = {
            ...localItem,
            name: localItem.name!.trim(),
            description: localItem.description?.trim() || undefined,
            profile: extractId(localItem.profile) || undefined,
            historyRules: toIdList(localItem.historyRules as any[])
        } as IMemberRequirement;

        const base = validateMemberRequirement(payload);
        if (!base.valid) {
            setFormError(base.message ?? 'Requirement is invalid.');
            return;
        }

        await onSubmit(payload);
    };

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
                    placeholder="e.g. Senior Researcher Requirement"
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
                    Demographic eligibility profile
                </label>
                <Dropdown
                    inputId="profile"
                    value={(localItem.profile as string) ?? null}
                    options={profileOptions}
                    disabled={saving || loadingOptions}
                    onChange={(e) => update('profile', e.value ?? undefined)}
                    placeholder={loadingOptions ? 'Loading…' : 'Select profile (optional)'}
                    showClear
                    filter
                />
            </div>

            {/* History Rules MultiSelect */}
            <div className="field mb-4">
                <label htmlFor="historyRules" className="font-bold text-sm block mb-2">
                    History Rules <span className="text-red-500">*</span>
                </label>
                <MultiSelect
                    inputId="historyRules"
                    value={(localItem.historyRules as unknown as string[]) ?? []}
                    options={historyOptions}
                    disabled={saving || loadingOptions}
                    onChange={(e) => update('historyRules', e.value)}
                    placeholder={loadingOptions ? 'Loading…' : 'Select history rules...'}
                    display="chip"
                    filter
                    className={classNames({ 'p-invalid': submitted && historyRulesMissing })}
                />
                {submitted && historyRulesMissing && (
                    <small className="p-error block mt-1">At least one history rule is required.</small>
                )}
                <small className="text-500 block mt-1">
                    Select the history rules that apply to members satisfying this requirement.
                </small>
            </div>

            {formError && (
                <Message severity="error" text={formError} className="w-full mt-3 justify-content-start" />
            )}
        </form>
    );
};

export default RequirementForm;