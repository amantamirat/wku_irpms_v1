'use client';

import { FormEvent, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Message } from 'primereact/message';
import { classNames } from 'primereact/utils';

import { ItemFormRenderProps } from '@/components/ItemManager';
import { IRange } from '@/types/range';
import { Constraint, validateConstraint } from '../models/constraint.model';

/* ---------- Types & config ---------- */

type RangeKey = {
    [K in keyof Constraint]-?: NonNullable<Constraint[K]> extends IRange ? K : never;
}[keyof Constraint];

interface RangeFieldConfig {
    key: RangeKey;
    label: string;
    description: string;
    unit: string;
    currency?: boolean;
}

interface SectionConfig {
    title: string;
    subtitle: string;
    icon: string;
    fields: RangeFieldConfig[];
}

const SECTIONS: SectionConfig[] = [
    {
        title: 'Content limits',
        subtitle: 'Control the size of project titles and summaries.',
        icon: 'pi pi-file-edit',
        fields: [
            { key: 'titleWords', label: 'Title words', description: 'Allowed number of words in the project title.', unit: 'words' },
            { key: 'summaryWords', label: 'Summary words', description: 'Allowed number of words in the project summary.', unit: 'words' }
        ]
    },
    {
        title: 'Objectives & outputs',
        subtitle: 'Limits for general/specific objectives and expected outputs.',
        icon: 'pi pi-check-circle',
        fields: [
            { key: 'generalObjectiveWords', label: 'General objective words', description: 'Allowed number of words for general objectives.', unit: 'words' },
            { key: 'specificObjectiveWords', label: 'Specific objective words', description: 'Allowed number of words per specific objective.', unit: 'words' },
            { key: 'specificObjectives', label: 'Specific objectives', description: 'Allowed number of specific objectives.', unit: 'objectives' },
            { key: 'expectedOutputs', label: 'Expected outputs', description: 'Allowed number of expected outputs.', unit: 'outputs' },
            { key: 'expectedOutputWords', label: 'Expected output words', description: 'Allowed number of words per expected output description.', unit: 'words' }
        ]
    },
    {
        title: 'Project structure',
        subtitle: 'Project size, participants, phases and resources.',
        icon: 'pi pi-sitemap',
        fields: [
            { key: 'participants', label: 'Participants', description: 'Number of participants allowed in a project.', unit: 'people' },
            { key: 'phases', label: 'Number of phases', description: 'Allowed number of project phases.', unit: 'phases' },
            { key: 'budget', label: 'Project budget', description: 'Total project budget range.', unit: 'ETB', currency: true },
            { key: 'duration', label: 'Project duration', description: 'Allowed project duration.', unit: 'days' },
            { key: 'activities', label: 'Activities', description: 'Allowed number of activities.', unit: 'activities' },
            { key: 'equipments', label: 'Equipments', description: 'Allowed number of equipment items.', unit: 'items' },
            { key: 'components', label: 'Components', description: 'Allowed number of project components.', unit: 'components' }
        ]
    },
    {
        title: 'Phase, activity & equipment limits',
        subtitle: 'Limits for individual phases, activities and equipment.',
        icon: 'pi pi-calendar',
        fields: [
            { key: 'phaseBudget', label: 'Phase budget', description: 'Allowed budget for each phase.', unit: 'ETB', currency: true },
            { key: 'phaseDuration', label: 'Phase duration', description: 'Allowed duration for each phase.', unit: 'days' },
            { key: 'activityDuration', label: 'Activity duration', description: 'Allowed duration for each activity.', unit: 'days' },
            { key: 'equipmentCost', label: 'Equipment cost', description: 'Allowed cost for each equipment item.', unit: 'ETB', currency: true }
        ]
    },
    {
        title: 'Taxonomy & indicators',
        subtitle: 'Number of themes, focus areas and indicators.',
        icon: 'pi pi-tags',
        fields: [
            { key: 'themes', label: 'Themes', description: 'Allowed number of themes.', unit: 'themes' },
            { key: 'subThemes', label: 'Sub-themes', description: 'Allowed number of sub-themes.', unit: 'sub-themes' },
            { key: 'focusAreas', label: 'Focus areas', description: 'Allowed number of focus areas.', unit: 'areas' },
            { key: 'indicators', label: 'Indicators', description: 'Allowed number of indicators.', unit: 'indicators' }
        ]
    }
];

const emptyConstraint = (): Constraint => ({ name: '', description: '' });

/* ---------- Form ---------- */

const ConstraintForm = ({
    item,
    saving,
    formId,
    onSubmit
}: ItemFormRenderProps<Constraint>) => {
    // The form is mounted when the dialog opens, so state starts fresh each time.
    // Deep-copy ranges so editing never mutates the original item.
    const [localItem, setLocalItem] = useState<Constraint>(() =>
        item ? structuredClone(item) : emptyConstraint()
    );
    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | number[]>([0]);

    const nameMissing = !localItem.name?.trim();

    const updateField = <K extends keyof Constraint>(field: K, value: Constraint[K]) => {
        setLocalItem((prev) => ({ ...prev, [field]: value }));
        setFormError(null);
    };

    const updateRange = (
        key: RangeKey,
        bound: 'min' | 'max',
        value: number | null
    ) => {
        setLocalItem((prev) => {
            const updated = {
                ...(prev[key] ?? {}),
                [bound]: value ?? undefined
            } as Partial<IRange>;

            const next = { ...prev };

            // Both bounds empty -> remove the range so it isn't enforced
            if (updated.min === undefined && updated.max === undefined) {
                delete next[key];
            } else {
                next[key] = updated as IRange;
            }
            return next;
        });
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (saving) return;
        if (nameMissing) return;

        const validation = validateConstraint(localItem);
        if (!validation.valid) {
            setFormError(validation.message ?? 'Constraint is invalid.');
            return;
        }

        await onSubmit({
            ...localItem,
            name: localItem.name.trim(),
            description: localItem.description?.trim() || undefined
        });
    };

    const renderRange = (field: RangeFieldConfig) => {
        const range = localItem[field.key];
        const id = `${formId}-${field.key}`;
        const currency = field.currency ?? false;

        const numberProps = {
            mode: currency ? ('currency' as const) : ('decimal' as const),
            currency: currency ? 'ETB' : undefined,
            locale: 'en-ET',
            minFractionDigits: currency ? 2 : 0,
            maxFractionDigits: 2,
            disabled: saving,
            className: 'w-full',
            inputClassName: 'w-full'
        };

        return (
            <div key={field.key} className="col-12 md:col-6">
                <div className="p-3 border-1 surface-border border-round h-full surface-card">
                    <div className="flex align-items-start justify-content-between mb-3">
                        <div>
                            <div className="font-semibold text-900">{field.label}</div>
                            <small className="text-500 block mt-1 line-height-3">
                                {field.description}
                            </small>
                        </div>
                        <span className="text-xs px-2 py-1 border-round surface-100 text-600 white-space-nowrap">
                            {field.unit}
                        </span>
                    </div>

                    <div className="grid">
                        <div className="col-12 sm:col-6">
                            <label htmlFor={`${id}-min`} className="block text-sm text-600 mb-2">
                                Minimum
                            </label>
                            <InputNumber
                                {...numberProps}
                                inputId={`${id}-min`}
                                value={range?.min ?? null}
                                onValueChange={(e) => updateRange(field.key, 'min', e.value ?? null)}
                                placeholder="No minimum"
                            />
                        </div>

                        <div className="col-12 sm:col-6">
                            <label htmlFor={`${id}-max`} className="block text-sm text-600 mb-2">
                                Maximum
                            </label>
                            <InputNumber
                                {...numberProps}
                                inputId={`${id}-max`}
                                value={range?.max ?? null}
                                onValueChange={(e) => updateRange(field.key, 'max', e.value ?? null)}
                                placeholder="No maximum"
                            />
                        </div>
                    </div>

                    {!range && (
                        <div className="flex align-items-center gap-2 mt-2 text-sm text-500">
                            <i className="pi pi-info-circle" />
                            <span>Leave both fields empty to skip this constraint.</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <form id={formId} onSubmit={handleSubmit} className="p-fluid" noValidate>
            {/* Name */}
            <div className="field mb-4">
                <label htmlFor="name" className="font-bold text-sm block mb-2">
                    Constraint name <span className="text-red-500">*</span>
                </label>

                <InputText
                    id="name"
                    value={localItem.name ?? ''}
                    disabled={saving}
                    onChange={(e) => updateField('name', e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. Standard Research Grant Limits"
                    className={classNames({ 'p-invalid': submitted && nameMissing })}
                />

                {submitted && nameMissing && (
                    <small className="p-error">Constraint name is required.</small>
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
                    rows={3}
                    autoResize
                    placeholder="Describe when this constraint profile should be used (optional)"
                />
            </div>

            {/* Range groups */}
            <div className="mb-2">
                <div className="font-bold text-sm mb-1">Limits</div>
                <small className="text-500">
                    Only configured limits will be enforced.
                </small>
            </div>

            <Accordion
                multiple
                activeIndex={activeIndex}
                onTabChange={(e) => setActiveIndex(e.index)}
                className="mt-2"
            >
                {SECTIONS.map((section) => (
                    <AccordionTab
                        key={section.title}
                        header={
                            <div className="flex align-items-center gap-3">
                                <i className={`${section.icon} text-primary`} />
                                <div>
                                    <div className="font-semibold">{section.title}</div>
                                    <small className="text-500">{section.subtitle}</small>
                                </div>
                            </div>
                        }
                    >
                        <div className="grid pt-2">
                            {section.fields.map(renderRange)}
                        </div>
                    </AccordionTab>
                ))}
            </Accordion>

            {/* Validation error from validateConstraint */}
            {formError && (
                <Message severity="error" text={formError} className="w-full mt-3 justify-content-start" />
            )}
        </form>
    );
};

export default ConstraintForm;