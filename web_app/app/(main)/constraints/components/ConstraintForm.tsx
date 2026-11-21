'use client';

import { FormEvent, useMemo, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { FieldError, FieldHint, FieldLabel, SectionCard } from '@/templates/FormPrimitives';
import { IRange } from '@/types/range';
import { Constraint } from '../models/constraint.model';

/* ---------- Types & config ---------- */

export type GroupKey =
    | 'projectConstraints'
    | 'collaboratorConstraints'
    | 'phaseConstraints'
    | 'activityConstraints'
    | 'equipmentConstraints'
    | 'componentConstraints';

type FieldKeyOf<G extends GroupKey> = keyof NonNullable<Constraint[G]> & string;

export interface RangeFieldConfig {
    group: GroupKey;
    key: string;
    label: string;
    description: string;
    /** Plural unit label, e.g. "words" */
    unit: string;
    /** Singular unit label, e.g. "word". Defaults to `unit`. */
    singular?: string;
    currency?: boolean;
}

export interface SectionConfig {
    title: string;
    subtitle: string;
    icon: string;
    fields: RangeFieldConfig[];
}

type FieldInput<G extends GroupKey> = Omit<RangeFieldConfig, 'group' | 'key'> & {
    key: FieldKeyOf<G>;
};

// Keys are type-checked against the model of the given group.
const defineSection = <G extends GroupKey>(
    group: G,
    meta: Omit<SectionConfig, 'fields'>,
    fields: FieldInput<G>[]
): SectionConfig => ({
    ...meta,
    fields: fields.map((f) => ({ ...f, group }))
});

export const SECTIONS: SectionConfig[] = [
    defineSection(
        'projectConstraints',
        {
            title: 'Project content limits',
            subtitle: 'Control the size of project titles, summaries, and keywords.',
            icon: 'pi pi-file-edit'
        },
        [
            { key: 'titleWords', label: 'Title words', description: 'Allowed number of words in the project title.', unit: 'words', singular: 'word' },
            { key: 'summaryWords', label: 'Summary words', description: 'Allowed number of words in the project summary.', unit: 'words', singular: 'word' },
            { key: 'keyWords', label: 'Keywords', description: 'Allowed number of keywords for the project.', unit: 'keywords', singular: 'keyword' }
        ]
    ),
    defineSection(
        'projectConstraints',
        {
            title: 'Objectives & outputs',
            subtitle: 'Limits for general/specific objectives and expected outputs.',
            icon: 'pi pi-check-circle'
        },
        [
            { key: 'generalObjectiveWords', label: 'General objective words', description: 'Allowed number of words for general objectives.', unit: 'words', singular: 'word' },
            { key: 'specificObjectiveWords', label: 'Specific objective words', description: 'Allowed number of words per specific objective.', unit: 'words', singular: 'word' },
            { key: 'specificObjectives', label: 'Specific objectives', description: 'Allowed number of specific objectives.', unit: 'objectives', singular: 'objective' },
            { key: 'expectedOutputs', label: 'Expected outputs', description: 'Allowed number of expected outputs.', unit: 'outputs', singular: 'output' },
            { key: 'expectedOutputWords', label: 'Expected output words', description: 'Allowed number of words per expected output description.', unit: 'words', singular: 'word' }
        ]
    ),
    defineSection(
        'projectConstraints',
        {
            title: 'Project budget, duration & themes',
            subtitle: 'Overall financial ceiling, timeline boundaries, and classification.',
            icon: 'pi pi-wallet'
        },
        [
            { key: 'budget', label: 'Project budget', description: 'Total overall project budget range.', unit: 'ETB', currency: true },
            { key: 'duration', label: 'Project duration', description: 'Total allowed project timeline duration.', unit: 'days', singular: 'day' },
            { key: 'themes', label: 'Themes', description: 'Allowed number of themes.', unit: 'themes', singular: 'theme' }
        ]
    ),
    defineSection(
        'collaboratorConstraints',
        {
            title: 'Collaborators',
            subtitle: 'Team size limits for a project.',
            icon: 'pi pi-users'
        },
        [{ key: 'members', label: 'Members', description: 'Number of members allowed in a project.', unit: 'people', singular: 'person' }]
    ),
    defineSection(
        'phaseConstraints',
        {
            title: 'Phases',
            subtitle: 'Number of phases and per-phase budget and duration.',
            icon: 'pi pi-sitemap'
        },
        [
            { key: 'phases', label: 'Number of phases', description: 'Allowed number of project phases.', unit: 'phases', singular: 'phase' },
            { key: 'budget', label: 'Phase budget', description: 'Allowed budget for each individual phase.', unit: 'ETB', currency: true },
            { key: 'duration', label: 'Phase duration', description: 'Allowed duration for each individual phase.', unit: 'days', singular: 'day' }
        ]
    ),
    defineSection(
        'activityConstraints',
        {
            title: 'Activities',
            subtitle: 'Number of activities and per-activity cost and duration.',
            icon: 'pi pi-list'
        },
        [
            { key: 'activities', label: 'Activities', description: 'Allowed number of activities.', unit: 'activities', singular: 'activity' },
            { key: 'cost', label: 'Activity cost', description: 'Allowed cost for each individual activity.', unit: 'ETB', currency: true },
            { key: 'duration', label: 'Activity duration', description: 'Allowed duration for each individual activity.', unit: 'days', singular: 'day' }
        ]
    ),
    defineSection(
        'equipmentConstraints',
        {
            title: 'Equipment',
            subtitle: 'Number of equipment items and per-item cost.',
            icon: 'pi pi-box'
        },
        [
            { key: 'equipments', label: 'Equipments', description: 'Allowed number of equipment items.', unit: 'items', singular: 'item' },
            { key: 'cost', label: 'Equipment cost', description: 'Allowed cost for each equipment item.', unit: 'ETB', currency: true }
        ]
    ),
    defineSection(
        'componentConstraints',
        {
            title: 'Components',
            subtitle: 'Number of components and collaborators per component.',
            icon: 'pi pi-th-large'
        },
        [
            { key: 'components', label: 'Components', description: 'Allowed number of project components.', unit: 'components', singular: 'component' },
            { key: 'collaborators', label: 'Component collaborators', description: 'Allowed number of collaborators in a component.', unit: 'collaborators', singular: 'collaborator' }
        ]
    )
];

/* ---------- Helpers (shared with ConstraintView / ConstraintManager) ---------- */

type GroupRecord = Record<string, IRange | undefined>;

export const getRange = (
    constraint: Constraint,
    group: GroupKey,
    key: string
): IRange | undefined =>
    (constraint[group] as GroupRecord | undefined)?.[key];

const isRangeInverted = (range?: Partial<IRange>) =>
    range?.min != null && range?.max != null && range.min > range.max;

// Exactly one bound filled in. A range is valid only with both, or with neither.
const isRangeIncomplete = (range?: Partial<IRange>) =>
    (range?.min != null) !== (range?.max != null);

const MSG_INCOMPLETE = 'Both minimum and maximum are required.';
const MSG_INVERTED = "Minimum can't be greater than maximum.";

const fieldId = (f: RangeFieldConfig) => `${f.group}.${f.key}`;

const emptyConstraint = (): Constraint => ({ name: '', description: '' });

/* ---------- Form ---------- */

const ConstraintForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Constraint>) => {
    const [localItem, setLocalItem] = useState<Constraint>(() =>
        item ? structuredClone(item) : emptyConstraint()
    );
    const [submitted, setSubmitted] = useState(false);

    const nameMissing = !localItem.name?.trim();

    // Field id -> error message (incomplete range, or min > max)
    const fieldErrors = useMemo(() => {
        const map = new Map<string, string>();
        SECTIONS.forEach((s) =>
            s.fields.forEach((f) => {
                const range = getRange(localItem, f.group, f.key);
                if (isRangeIncomplete(range)) map.set(fieldId(f), MSG_INCOMPLETE);
                else if (isRangeInverted(range)) map.set(fieldId(f), MSG_INVERTED);
            })
        );
        return map;
    }, [localItem]);

    const updateField = <K extends keyof Constraint>(field: K, value: Constraint[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
    };

    const updateRange = (
        group: GroupKey,
        key: string,
        bound: 'min' | 'max',
        value: number | null
    ) => {
        setLocalItem((prev) => {
            const groupData: GroupRecord = { ...((prev[group] as GroupRecord | undefined) ?? {}) };
            const range: Partial<IRange> = { ...(groupData[key] ?? {}) };

            if (value == null) delete range[bound];
            else range[bound] = value;

            // Drop empty ranges, and drop empty groups
            if (range.min === undefined && range.max === undefined) delete groupData[key];
            else groupData[key] = range as IRange;

            const next: Record<string, unknown> = { ...prev };
            if (Object.keys(groupData).length === 0) delete next[group];
            else next[group] = groupData;

            return next as unknown as Constraint;
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing) return;
        if (fieldErrors.size > 0) return; // sections with errors expand automatically

        await onSubmit({
            ...localItem,
            name: localItem.name.trim(),
            description: localItem.description?.trim() || undefined
        });
    };

    const renderRange = (field: RangeFieldConfig) => {
        const range = getRange(localItem, field.group, field.key);
        const id = `${formId}-${field.group}-${field.key}`;
        const currency = field.currency ?? false;
        const error = fieldErrors.get(fieldId(field));
        const inverted = isRangeInverted(range);
        // "Incomplete" is only flagged after a submit attempt, so typing the first bound isn't punished.
        const showError = !!error && (submitted || inverted);
        const minInvalid = showError && (inverted || range?.min == null);
        const maxInvalid = showError && (inverted || range?.max == null);

        const numberProps = {
            mode: currency ? ('currency' as const) : ('decimal' as const),
            currency: currency ? 'ETB' : undefined,
            locale: 'en-ET',
            minFractionDigits: currency ? 2 : 0,
            maxFractionDigits: 2,
            disabled: saving,
            inputClassName: 'w-full'
        };

        return (
            <div key={fieldId(field)} className="col-12 md:col-6">
                <div className="p-3 border-1 surface-border border-round-xl h-full surface-card shadow-sm hover:shadow-2 transition-all transition-duration-200">
                    <div className="flex align-items-start justify-content-between mb-3">
                        <div>
                            <div className="font-semibold text-900 text-base">{field.label}</div>
                            <small className="text-500 block mt-1 line-height-3">
                                {field.description}
                            </small>
                        </div>
                        <span className="text-xs px-2.5 py-1 border-round-pill surface-100 text-700 font-medium white-space-nowrap">
                            {field.unit}
                        </span>
                    </div>

                    <div className="grid formgroup-inline">
                        <div className="col-12 sm:col-6">
                            <FieldLabel htmlFor={`${id}-min`}>Minimum</FieldLabel>
                            <InputNumber
                                {...numberProps}
                                className={classNames('w-full', { 'p-invalid': minInvalid })}
                                inputId={`${id}-min`}
                                value={range?.min ?? null}
                                onValueChange={(e) => updateRange(field.group, field.key, 'min', e.value ?? null)}
                                placeholder="Minimum"
                            />
                        </div>

                        <div className="col-12 sm:col-6">
                            <FieldLabel htmlFor={`${id}-max`}>Maximum</FieldLabel>
                            <InputNumber
                                {...numberProps}
                                className={classNames('w-full', { 'p-invalid': maxInvalid })}
                                inputId={`${id}-max`}
                                value={range?.max ?? null}
                                onValueChange={(e) => updateRange(field.group, field.key, 'max', e.value ?? null)}
                                placeholder="Maximum"
                            />
                        </div>
                    </div>

                    <FieldError show={showError}>{error}</FieldError>

                    {!range && (
                        <FieldHint className="mt-3">
                            Leave both empty to skip enforcing this constraint.
                        </FieldHint>
                    )}
                </div>
            </div>
        );
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid flex flex-column gap-3" noValidate>
            {/* Basic information */}
            <SectionCard
                step={1}
                icon="pi-id-card"
                title="Basic information"
                description="Name this profile and describe when it should be used."
                collapsible={false}
            >
                <div className="field mb-4">
                    <FieldLabel htmlFor="name" required>
                        Constraint name
                    </FieldLabel>
                    <InputText
                        id="name"
                        value={localItem.name ?? ''}
                        disabled={saving}
                        onChange={(e) => updateField('name', e.target.value)}
                        required
                        autoFocus
                        placeholder="e.g. Standard Research Grant Limits"
                        className={classNames({ 'p-invalid': submitted && nameMissing }, 'w-full')}
                    />
                    <FieldError show={submitted && nameMissing}>
                        Constraint name is required.
                    </FieldError>
                </div>

                <div className="field mb-0">
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <InputTextarea
                        id="description"
                        value={localItem.description ?? ''}
                        disabled={saving}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={3}
                        autoResize
                        placeholder="Describe when this constraint profile should be used (optional)"
                        className="w-full"
                    />
                </div>
            </SectionCard>

            {/* Limit groups */}
            {SECTIONS.map((section, index) => (
                <SectionCard
                    key={section.title}
                    step={index + 2}
                    icon={section.icon.replace(/^pi\s+/, '')}
                    title={section.title}
                    description={section.subtitle}
                    defaultCollapsed={index !== 0 && index !== 2}
                    expandWhen={
                        submitted &&
                        section.fields.some((f) => fieldErrors.has(fieldId(f)))
                    }
                >
                    <div className="grid">{section.fields.map(renderRange)}</div>
                </SectionCard>
            ))}

            <FieldHint>Each limit needs both a minimum and a maximum. Limits left empty aren't enforced.</FieldHint>
        </form>
    );
};

export default ConstraintForm;